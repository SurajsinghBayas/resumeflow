import Link from "next/link";

export function Logo({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const mark = tone === "paper" ? "#f3efe6" : "#1c1714";
  const accent = "#c45c26";
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="3" y="4" width="16" height="20" rx="2" fill={mark} />
        <rect x="9" y="3" width="16" height="20" rx="2" fill={accent} />
        <path d="M13 9h8M13 13h8M13 17h5" stroke={tone === "paper" ? "#1c1714" : "#fffdf9"} strokeWidth="1.4" />
      </svg>
      <span className="font-serif text-xl tracking-tight">ResumeFlow</span>
    </Link>
  );
}
