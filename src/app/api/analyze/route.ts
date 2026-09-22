import { randomUUID } from "crypto";
import { runReview } from "@/lib/agents";
import { readSession } from "@/lib/auth";
import { countAnalysesToday, getProfile, insertAnalysis } from "@/lib/db";
import {
  CONTACT_LINKEDIN_URL,
  MAX_REVIEWS_PER_DAY,
  limitReachedMessage,
} from "@/lib/limits";
import { LlmError } from "@/lib/llm";
import { NOT_A_JOB_DESCRIPTION, looksLikeJobDescription, normalizeJobDescription } from "@/lib/jobdesc";
import { reviewModels } from "@/lib/models";
import { crossOriginResponse, isSameOrigin } from "@/lib/request";
import { extractResumeText } from "@/lib/resume";
import type { AnalysisRecord } from "@/lib/types";

export const runtime = "nodejs";
// Vercel Hobby caps functions at 60s. Typical reviews finish in 20-50s.
// Raise to 120 on Pro / EC2 if slow reviews time out.
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return crossOriginResponse();
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in to review a resume." }, { status: 401 });
  }

  const profile = await getProfile(session.id);
  if (!profile?.onboarded) {
    return Response.json({ error: "Finish onboarding before running a review." }, { status: 400 });
  }

  const usedToday = await countAnalysesToday(session.id);
  if (usedToday >= MAX_REVIEWS_PER_DAY) {
    return Response.json(
      {
        error: limitReachedMessage(),
        contactUrl: CONTACT_LINKEDIN_URL,
        limit: MAX_REVIEWS_PER_DAY,
        remaining: 0,
      },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const jobDescription = normalizeJobDescription(form.get("jobDescription"));
  const resume = form.get("resume");

  if (jobDescription.length < 40) {
    return Response.json(
      { error: "Paste a job description of at least a few sentences." },
      { status: 400 },
    );
  }
  if (jobDescription.length > 20000) {
    return Response.json({ error: "That job description is too long. Keep it under 20,000 characters." }, { status: 400 });
  }
  if (!looksLikeJobDescription(jobDescription)) {
    return Response.json({ error: NOT_A_JOB_DESCRIPTION }, { status: 400 });
  }
  if (!(resume instanceof File)) {
    return Response.json({ error: "Upload a resume to review." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        send({ type: "status", message: "Reading the uploaded resume." });
        const resumeText = await extractResumeText(resume);

        const models = reviewModels();
        const report = await runReview({
          profile,
          jobDescription,
          resumeText,
          models,
          send,
        });

        const id = randomUUID();
        const modelLabel = models.reviewer;
        const createdAt = await insertAnalysis({
          id,
          userId: session.id,
          filename: resume.name.slice(0, 180) || "resume",
          jobDescription,
          resumeText,
          model: modelLabel,
          report,
        });

        const analysis: AnalysisRecord = {
          id,
          filename: resume.name || "resume",
          model: modelLabel,
          jobDescription,
          report,
          createdAt,
        };
        send({ type: "result", analysis });
      } catch (error) {
        const message =
          error instanceof LlmError || error instanceof Error
            ? error.message
            : "The review could not be completed.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
