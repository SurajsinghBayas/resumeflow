import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { readSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function HomePage() {
  const session = await readSession();
  let href = "/signup";
  let label = "Create account";
  if (session) {
    const profile = await getProfile(session.id).catch(() => null);
    href = profile?.onboarded ? "/dashboard" : "/onboarding";
    label = profile?.onboarded ? "Open dashboard" : "Continue setup";
  }

  return (
    <div className="flex flex-1 flex-col">
      <NavBar action={{ href, label }} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16">
        <section className="max-w-3xl pt-10 sm:pt-16">
          <p className="text-xs font-medium tracking-[0.18em] text-clay uppercase">Resume review</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl">
            Know what to keep, and what to rewrite.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Answer a few questions about the work you want. Then paste a job description, upload your resume, and get
            what already lands, what a hiring manager would question, and which lines to change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href} className="rounded-full bg-clay px-5 py-3 text-sm font-medium text-paper">
              {label}
            </Link>
            <Link href="/login" className="rounded-full border border-line bg-card px-5 py-3 text-sm">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Aim" text="Job title, work style, skills, and the expertise you want the review to respect." />
          <Step n="02" title="Compare" text="Paste a job description and upload your resume." />
          <Step n="03" title="Revise" text="Strengths, constructive notes, and rewrites that do not invent a career you have not had." />
        </section>
      </main>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-line bg-card p-5">
      <p className="text-xs tracking-[0.16em] text-muted">{n}</p>
      <h2 className="mt-3 font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
