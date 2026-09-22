"use client";

import Link from "next/link";
import { useState } from "react";
import { ReportView } from "@/components/report-view";
import type { AnalysisRecord } from "@/lib/types";

export function ReviewsBrowser({ initialAnalyses }: { initialAnalyses: AnalysisRecord[] }) {
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [activeId, setActiveId] = useState(initialAnalyses[0]?.id ?? "");
  const active = analyses.find((item) => item.id === activeId) ?? null;

  async function deleteReview(id: string) {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    const response = await fetch(`/api/analyses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setAnalyses((current) => {
      const next = current.filter((item) => item.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? "");
      return next;
    });
  }

  if (analyses.length === 0) {
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
        {analyses.map((item) => (
          <li key={item.id}>
            <div
              className={`flex items-start gap-2 rounded-2xl border px-4 py-3 ${
                item.id === activeId ? "border-ink bg-card" : "border-line bg-card/70"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium">{item.filename}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.report.matchLabel} · {item.report.matchScore}
                </p>
                <p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
              </button>
              <button
                type="button"
                onClick={() => deleteReview(item.id)}
                aria-label={`Delete ${item.filename}`}
                title="Delete review"
                className="mt-1 shrink-0 text-xs text-muted underline underline-offset-4 hover:text-warn"
              >
                Delete
              </button>
            </div>
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
