import { ReportActions } from "@/components/report-actions";
import type { Critique, Report, Suggestion } from "@/lib/types";

export function ReportView({ report }: { report: Report }) {
  return (
    <article className="min-w-0 space-y-8">
      <header className="grid gap-6 rounded-3xl border border-line bg-card p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <Score score={report.matchScore} label={report.matchLabel} />
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-clay uppercase">
            {report.targetRole || "Target role"}
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-balance break-words">{report.summary}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{report.alignment}</p>
        </div>
      </header>

      <AgentTrace agents={report.agents} />

      <section>
        <SectionTitle eyebrow="Good things" title="What already works" />
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {report.strengths.map((item, index) => (
            <li key={`${item.title}-${index}`} className="rounded-2xl border border-forest/15 bg-moss px-4 py-4">
              <h3 className="font-medium text-forest">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/80">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle eyebrow="Constructive" title="What to tighten" />
        <ul className="mt-4 space-y-3">
          {report.constructive.map((item, index) => (
            <li key={`${item.title}-${index}`} className="rounded-2xl border border-line bg-card px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{item.title}</h3>
                <ImpactPill impact={item.impact} />
              </div>
              <p className="mt-1.5 text-sm leading-6 text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle eyebrow="Suggestions" title="Lines worth rewriting" />
          <ReportActions report={report} />
        </div>
        <ul className="mt-4 space-y-4">
          {report.suggestions.map((item, index) => (
            <SuggestionCard key={`suggestion-${index}`} suggestion={item} />
          ))}
        </ul>
      </section>

      {(report.presentKeywords.length > 0 || report.missingKeywords.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <KeywordList title="Already on the page" words={report.presentKeywords} tone="present" />
          <KeywordList title="Missing from the resume" words={report.missingKeywords} tone="missing" />
        </section>
      )}
    </article>
  );
}

function Score({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e4d9cc" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#c45c26"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="53" textAnchor="middle" fontSize="22" fontFamily="Fraunces, serif" fill="#1c1714">
          {score}
        </text>
      </svg>
      <div>
        <p className="font-serif text-2xl">{label}</p>
        <p className="text-sm text-muted">out of 100</p>
      </div>
    </div>
  );
}

function AgentTrace({ agents }: { agents: Report["agents"] }) {
  if (!agents?.length) return null;
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {agents.map((agent, index) => (
        <li key={`agent-${index}`} className="min-w-0 rounded-2xl border border-line bg-card px-4 py-3">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">0{index + 1}</p>
          <p className="mt-1 font-medium">{agent.label}</p>
          <p className="mt-2 text-sm text-muted">{agent.note}</p>
        </li>
      ))}
    </ol>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.16em] text-clay uppercase">{eyebrow}</p>
      <h3 className="mt-1 font-serif text-2xl tracking-tight">{title}</h3>
    </div>
  );
}

function ImpactPill({ impact }: { impact: Critique["impact"] }) {
  const label = impact === "high" ? "High impact" : impact === "low" ? "Light touch" : "Worth a pass";
  return (
    <span className="rounded-full bg-warn-bg px-2.5 py-0.5 text-xs font-medium text-warn">{label}</span>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <li className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{suggestion.section}</h3>
        <p className="text-sm text-muted">{suggestion.issue}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <blockquote className="min-w-0 rounded-xl bg-paper px-3 py-3 text-sm leading-6 break-words text-muted">
          <span className="mb-1 block text-xs tracking-[0.14em] uppercase">Now</span>
          {suggestion.before}
        </blockquote>
        <blockquote className="min-w-0 rounded-xl bg-moss px-3 py-3 text-sm leading-6 break-words text-forest">
          <span className="mb-1 block text-xs tracking-[0.14em] text-forest/70 uppercase">Suggested</span>
          {suggestion.after}
        </blockquote>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/80">{suggestion.why}</p>
    </li>
  );
}

function dedupeWords(words: string[]) {
  const seen = new Set<string>();
  return words.filter((word) => {
    const key = word.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function KeywordList({
  title,
  words,
  tone,
}: {
  title: string;
  words: string[];
  tone: "present" | "missing";
}) {
  const uniqueWords = dedupeWords(words);
  if (uniqueWords.length === 0) return null;
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {uniqueWords.map((word, index) => (
          <li
            key={`${index}-${word}`}
            className={
              tone === "present"
                ? "rounded-full bg-moss px-3 py-1 text-sm text-forest"
                : "rounded-full border border-dashed border-clay/50 px-3 py-1 text-sm text-clay-deep"
            }
          >
            {word}
          </li>
        ))}
      </ul>
    </div>
  );
}
