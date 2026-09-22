export const NOT_A_JOB_DESCRIPTION =
  "This doesn't look like a job description. Paste the role's responsibilities and requirements.";

export function normalizeJobDescription(raw: unknown) {
  return (
    String(raw ?? "")
      // Strip control characters that never belong in pasted text.
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export function looksLikeJobDescription(text: string) {
  const sample = text.slice(0, 12000).toLowerCase();
  const groups = [
    // Role content: duties and requirements.
    /\b(responsibilit|requirement|qualification|key responsibilities|your responsibilities|what you.ll do|what you will do|about the role|job summary|day to day|day-to-day)\b/.test(
      sample,
    ),
    // Hiring logistics: employment terms and how to apply.
    /\b(benefits|salary|compensation|apply|job type|full-time|part-time|contract|remote|hybrid|on-site|onsite|equal opportunity)\b/.test(
      sample,
    ),
    // Hiring voice: company pitch and candidate ask.
    /\b(we are hiring|we.re hiring|about the company|join our team|the ideal candidate|preferred|must have|nice to have|years of experience|\d+\+?\s*years)\b/.test(
      sample,
    ),
    // Capability ask: skills and experience wanted.
    /\b(skills|experience with|proficient|familiarity|knowledge of|ability to|track record|proven)\b/.test(
      sample,
    ),
  ];
  const hits = groups.filter(Boolean).length;

  // Wrong document pasted: resume, cover letter, invoice, or recipe.
  const notJobDescription =
    /\b(curriculum vitae|\bwork history\b|dear hiring|sincerely|i am writing to apply|cover letter|invoice number|amount due|ingredients|preheat)\b/.test(
      sample,
    );
  if (notJobDescription && hits < 3) return false;
  return hits >= 2;
}
