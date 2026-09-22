"use client";

import Link from "next/link";
import { useState } from "react";
import { ReportView } from "@/components/report-view";
import type { AnalysisRecord } from "@/lib/types";

export function ReviewsBrowser({ initialAnalyses }: { initialAnalyses: AnalysisRecord[] }) {
  const [activeId, setActiveId] = useState(initialAnalyses[0]?.id ?? "");
  const active = initialAnalyses.find((item) => item.id === activeId) ?? null;

  if (initialAnalyses.length === 0) {
    return (
      <div className="mt-4 rounded-3xl border border-line bg-card p-8 text-center">
        <p className="text-sm text-muted">No reviews yet. Run your first review to see it here.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
        >
          Run a review
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ul className="max-h-[36rem] space-y-2 overflow-y-auto">
        {initialAnalyses.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActiveId(item.id)}
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
