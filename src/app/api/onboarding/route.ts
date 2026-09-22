import { z } from "zod";
import { readSession } from "@/lib/auth";
import { saveProfile } from "@/lib/db";
import { isLinkedinProfile } from "@/lib/linkedin";
import { SENIORITY_OPTIONS, WORK_STYLES } from "@/lib/preferences";
import { checkRateLimit, rateLimitedResponse } from "@/lib/ratelimit";
import { crossOriginResponse, isSameOrigin } from "@/lib/request";

const schema = z.object({
  jobTitle: z.string().trim().min(2).max(80),
  linkedin: z.string().trim().min(2).max(200),
  seniority: z.enum(SENIORITY_OPTIONS),
  workStyle: z.enum(WORK_STYLES),
  industries: z.array(z.string().trim().min(2).max(40)).min(1).max(8),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  expertise: z.string().trim().min(20).max(800),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return crossOriginResponse();
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in to save your preferences." }, { status: 401 });
  }
  const gate = checkRateLimit(`onboarding:${session.id}`, 30, 60_000);
  if (!gate.allowed) return rateLimitedResponse(gate.resetMs);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Add a job title, your LinkedIn profile, at least one skill, and a short note on your expertise." },
      { status: 400 },
    );
  }

  const industries = [...new Set(parsed.data.industries)];
  if (!isLinkedinProfile(parsed.data.linkedin)) {
    return Response.json(
      { error: "Add a LinkedIn profile link, like linkedin.com/in/your-name." },
      { status: 400 },
    );
  }

  await saveProfile(session.id, {
    ...parsed.data,
    industries,
    skills: [...new Set(parsed.data.skills)],
    onboarded: true,
  });
  return Response.json({ ok: true });
}
