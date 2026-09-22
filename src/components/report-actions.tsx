"use client";

import { useState } from "react";
import { changesFileName, formatChanges } from "@/lib/changes";
import type { Report } from "@/lib/types";

export function ReportActions({ report }: { report: Report }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const empty = (report.suggestions ?? []).length === 0;

  async function copyChanges() {
    const text = formatChanges(report);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const { buildChangesPdf } = await import("@/lib/changes-pdf");
      const bytes = buildChangesPdf(report);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = changesFileName(report);
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copyChanges}
        disabled={empty}
        className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {copied ? "Copied" : "Copy changes"}
      </button>
      <button
        type="button"
        onClick={downloadPdf}
        disabled={empty || downloading}
        className="rounded-full bg-clay px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
      >
        {downloading ? "Preparing PDF" : "Download PDF"}
      </button>
    </div>
  );
}
