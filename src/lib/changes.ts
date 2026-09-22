import type { Report } from "@/lib/types";

export type ChangeEntry = {
  number: number;
  section: string;
  issue: string;
  before: string;
  after: string;
  why: string;
};

export function changeEntries(report: Report): ChangeEntry[] {
  return (report.suggestions ?? []).map((item, index) => ({
    number: index + 1,
    section: item.section.trim() || "Resume",
    issue: item.issue.trim(),
    before: item.before.trim(),
    after: item.after.trim(),
    why: item.why.trim(),
  }));
}

export function changesHeading(report: Report) {
  const role = report.targetRole.trim() || "Target role";
  return `${role} | ${report.matchLabel} | ${report.matchScore}/100`;
}

export function formatChanges(report: Report) {
  const entries = changeEntries(report);
  const lines = ["Resume changes", changesHeading(report), ""];
  if (entries.length === 0) {
    lines.push("No line changes were suggested.");
    return lines.join("\n");
  }
  entries.forEach((entry, index) => {
    if (index > 0) lines.push("");
    lines.push(`${entry.number}. ${entry.section}`);
    if (entry.issue) lines.push(entry.issue);
    lines.push("", "Now", entry.before, "", "Suggested", entry.after, "", "Why", entry.why);
  });
  return lines.join("\n");
}

export function changesFileName(report: Report) {
  const role = (report.targetRole.trim() || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${role || "resume"}-changes.pdf`;
}
