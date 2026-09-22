"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ReportView } from "@/components/report-view";
import { linkedinHref, linkedinName } from "@/lib/linkedin";
import type { AnalysisRecord, LeaderboardEntry, Profile, SessionUser } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-clay focus:ring-2 focus:ring-clay/20";

export function DashboardApp({
  user,
  profile,
  initialAnalyses,
  initialLeaderboard,
  gatewayConfigured,
  reviewLimit,
  initialRemaining,
  contactUrl,
}: {
  user: SessionUser;
  profile: Profile;
  initialAnalyses: AnalysisRecord[];
  initialLeaderboard: LeaderboardEntry[];
  gatewayConfigured: boolean;
  reviewLimit: number;
  initialRemaining: number;
  contactUrl: string;
}) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [activeId, setActiveId] = useState(initialAnalyses[0]?.id ?? "");
  const [tab, setTab] = useState<"reviews" | "leaderboard">("reviews");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setShowContact(false);
    if (remaining <= 0) {
      setError(`You have used all ${reviewLimit} free reviews for today. For more, contact Suraj on LinkedIn.`);
      setShowContact(true);
      return;
    }
    if (!file || file.size === 0) {
      setError(file ? "This resume is empty. Upload it again." : "Upload your resume.");
      return;
    }
    setPending(true);
    setStatus("Starting the review team…");
    const form = new FormData();
    form.set("jobDescription", jobDescription);
    form.set("resume", file);

    const response = await fetch("/api/analyze", { method: "POST", body: form });
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        contactUrl?: string;
        remaining?: number;
      } | null;
      setPending(false);
      setStatus("");
      setError(body?.error || "The review could not start.");
      if (body?.contactUrl || response.status === 429) setShowContact(true);
      if (typeof body?.remaining === "number") setRemaining(body.remaining);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let failed = "";
    let failedContact = false;
    let failedRemaining: number | null = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as {
          type: string;
          message?: string;
          analysis?: AnalysisRecord;
          contactUrl?: string;
          remaining?: number;
        };
        if (event.type === "status" && event.message) setStatus(event.message);
        if (event.type === "error" && event.message) {
          failed = event.message;
          if (event.contactUrl) failedContact = true;
          if (typeof event.remaining === "number") failedRemaining = event.remaining;
        }
        if (event.type === "result" && event.analysis) {
          setAnalyses((current) => [event.analysis!, ...current.filter((item) => item.id !== event.analysis!.id)]);
          setActiveId(event.analysis.id);
          setTab("reviews");
          setRemaining((current) => Math.max(0, current - 1));
          const board = await fetch("/api/leaderboard");
          if (board.ok) {
            const body = (await board.json()) as { entries?: LeaderboardEntry[] };
            if (body.entries) setLeaderboard(body.entries);
          }
        }
      }
    }
    setPending(false);
    setStatus("");
    if (failed) {
      setError(failed);
      if (failedContact) setShowContact(true);
      if (failedRemaining !== null) setRemaining(failedRemaining);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Signed in as {user.email}</p>
          <h1 className="font-serif text-3xl tracking-tight">{firstName(user.name)}&apos;s desk</h1>
        </div>
        <button type="button" onClick={logout} className="text-sm text-muted underline underline-offset-4">
          Log out
        </button>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-line bg-card p-5">
          <p className="text-xs tracking-[0.16em] text-clay uppercase">Your aim</p>
          <h2 className="mt-2 font-serif text-2xl tracking-tight">{profile.jobTitle}</h2>
          <p className="mt-1 text-sm text-muted">
            {profile.seniority} · {profile.workStyle}
          </p>
          {profile.linkedin && (
            <a
              href={linkedinHref(profile.linkedin) ?? undefined}
              className="mt-2 inline-block text-sm text-clay-deep underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {linkedinName(profile.linkedin)}
            </a>
          )}
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded-full bg-paper px-2.5 py-1 text-xs">
                {skill}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-muted">{profile.expertise}</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-clay-deep">
            Update preferences
          </Link>
        </aside>

        <div className="min-w-0 space-y-6">
          {!gatewayConfigured && (
            <p className="rounded-2xl border border-clay/30 bg-warn-bg px-4 py-3 text-sm leading-6 text-warn">
              Add <code className="font-mono">OPENROUTER_API_KEY</code> to <code className="font-mono">.env.local</code>{" "}
              before running a review.
            </p>
          )}

          <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-muted">
            {remaining > 0 ? (
              <>
                {remaining} of {reviewLimit} free reviews left today.{" "}
                <a href={contactUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  Contact Suraj on LinkedIn
                </a>{" "}
                for more.
              </>
            ) : (
              <>
                You have used all {reviewLimit} free reviews for today.{" "}
                <a href={contactUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  Contact Suraj on LinkedIn
                </a>{" "}
                for more.
              </>
            )}
          </p>

          <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-card p-5 sm:p-6">
            <h2 className="font-serif text-3xl tracking-tight">Review a resume against a role</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Paste the job description and upload the resume. You will get what already works, what to tighten, and
              lines worth rewriting.
            </p>

            <label className="mt-5 block text-sm">
              <span className="mb-1.5 block font-medium">Job description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                required
                rows={8}
                className={fieldClass}
                placeholder="Paste the role you are applying to, including responsibilities and requirements."
              />
              <span className="mt-1 block text-xs text-muted">{jobDescription.trim().length} characters</span>
            </label>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const next = event.dataTransfer.files?.[0];
                if (next) setFile(next);
              }}
              className={`mt-4 rounded-2xl border border-dashed px-4 py-6 text-center ${
                dragging ? "border-clay bg-warn-bg" : "border-line bg-paper"
              }`}
            >
              <p className="text-sm font-medium">{file ? file.name : "Drop a resume here"}</p>
              <p className="mt-1 text-xs text-muted">PDF, DOCX, or TXT · up to 4 MB</p>
              <label className="mt-3 inline-block cursor-pointer rounded-full border border-line bg-card px-4 py-2 text-sm">
                Browse
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn" role="alert">
                {error}{" "}
                {showContact && (
                  <a href={contactUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    Contact Suraj on LinkedIn
                  </a>
                )}
              </p>
            )}
            {status && <p className="mt-4 text-sm text-forest">{status}</p>}

            <button
              type="submit"
              disabled={pending || remaining <= 0}
              className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-clay-deep disabled:opacity-60"
            >
              {pending ? "Reviewing…" : "Run review"}
            </button>
          </form>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex gap-2">
          <TabButton active={tab === "reviews"} onClick={() => setTab("reviews")}>
            Past reviews
          </TabButton>
          <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>
            Leaderboard
          </TabButton>
        </div>

        {tab === "reviews" ? (
          <PastReviews analyses={analyses} activeId={activeId} onSelect={setActiveId} />
        ) : (
          <Leaderboard entries={leaderboard} />
        )}
      </section>
    </div>
  );
}

function PastReviews({
  analyses,
  activeId,
  onSelect,
}: {
  analyses: AnalysisRecord[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const active = analyses.find((item) => item.id === activeId) ?? null;
  if (analyses.length === 0) {
    return <p className="mt-4 text-sm text-muted">Reviews you run will show up here.</p>;
  }
  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ul className="max-h-[36rem] space-y-2 overflow-y-auto">
        {analyses.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                item.id === activeId ? "border-ink bg-card" : "border-line bg-card/70"
              }`}
            >
              <p className="truncate font-medium">{item.filename}</p>
              <p className="mt-1 text-sm text-muted">
                {item.report.matchLabel} · {item.report.matchScore}
              </p>
              <p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0">
        {active ? (
          <>
            <p className="mb-3 text-sm text-muted">
              {active.filename} · {new Date(active.createdAt).toLocaleString()}
            </p>
            <ReportView report={active.report} />
          </>
        ) : (
          <p className="text-sm text-muted">Choose a review to read it.</p>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const you = entries.find((entry) => entry.isYou);
  return (
    <div className="mt-4">
      <p className="text-sm text-muted">Ranked by the highest score on each resume.</p>
      {you ? (
        <p className="mt-3 rounded-2xl bg-moss px-4 py-3 text-sm text-forest">
          Your resume is rank {you.rank} with a score of {you.score}.
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
          Run a review to see where your resume ranks.
        </p>
      )}
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No ranked resumes yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">LinkedIn</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={`${entry.rank}-${index}`} className={entry.isYou ? "bg-moss" : undefined}>
                  <td className="px-4 py-3 font-medium">{entry.rank}</td>
                  <td className="px-4 py-3">
                    {entry.linkedinHref ? (
                      <a href={entry.linkedinHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        {entry.linkedinName}
                      </a>
                    ) : (
                      entry.linkedinName
                    )}
                    {entry.isYou && <span className="ml-2 text-xs text-forest">You</span>}
                  </td>
                  <td className="px-4 py-3">{entry.role}</td>
                  <td className="px-4 py-3">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm ${active ? "bg-ink text-paper" : "border border-line bg-card"}`}
    >
      {children}
    </button>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}
