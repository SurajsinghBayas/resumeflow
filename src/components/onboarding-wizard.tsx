"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { INDUSTRY_OPTIONS, SENIORITY_OPTIONS, WORK_STYLES } from "@/lib/preferences";
import type { Profile } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-base outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/20 sm:text-[15px]";

const steps = ["Role", "Preferences", "Skills", "Expertise"] as const;

export function OnboardingWizard({ initial }: { initial: Profile | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [linkedin, setLinkedin] = useState(initial?.linkedin ?? "");
  const [seniority, setSeniority] = useState(initial?.seniority || "Mid-level");
  const [workStyle, setWorkStyle] = useState(initial?.workStyle || "Hybrid");
  const [industries, setIndustries] = useState<string[]>(initial?.industries ?? []);
  const [customIndustry, setCustomIndustry] = useState("");
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [expertise, setExpertise] = useState(initial?.expertise ?? "");

  function toggleIndustry(value: string) {
    setIndustries((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value].slice(0, 8),
    );
  }

  function addSkill() {
    const next = skillDraft.trim().replace(/,$/, "");
    if (!next || skills.includes(next) || skills.length >= 20) {
      setSkillDraft("");
      return;
    }
    setSkills((current) => [...current, next]);
    setSkillDraft("");
  }

  function addCustomIndustry() {
    const next = customIndustry.trim();
    if (!next || industries.includes(next)) {
      setCustomIndustry("");
      return;
    }
    setIndustries((current) => [...current, next].slice(0, 8));
    setCustomIndustry("");
  }

  function nextStep() {
    setError("");
    if (step === 0 && jobTitle.trim().length < 2) {
      setError("Add the job title you are aiming for.");
      return;
    }
    if (step === 0 && !/linkedin\.com\/(in|pub)\//i.test(linkedin.trim())) {
      setError("Add a LinkedIn profile link, like linkedin.com/in/your-name.");
      return;
    }
    if (step === 1 && industries.length === 0) {
      setError("Pick at least one industry.");
      return;
    }
    if (step === 2 && skills.length === 0) {
      setError("Add at least one skill.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finish() {
    setError("");
    if (expertise.trim().length < 20) {
      setError("Write a little more about what you are genuinely strong at.");
      return;
    }
    setPending(true);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: jobTitle.trim(),
        linkedin: linkedin.trim(),
        seniority,
        workStyle,
        industries,
        skills,
        expertise: expertise.trim(),
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "Could not save your preferences.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <ol className="mb-8 flex gap-2">
        {steps.map((label, index) => (
          <li key={label} className="min-w-0 flex-1">
            <div className={`h-1 rounded-full ${index <= step ? "bg-clay" : "bg-line"}`} />
            <p className={`mt-2 truncate text-[11px] sm:text-xs ${index === step ? "font-medium text-ink" : "text-muted"}`}>{label}</p>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight">What role are you aiming for?</h1>
            <p className="mt-2 text-muted">This steers every review toward the work you actually want.</p>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Job title</span>
            <input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              className={fieldClass}
              placeholder="Product designer"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">LinkedIn</span>
            <input
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
              className={fieldClass}
              placeholder="https://www.linkedin.com/in/your-name"
              inputMode="url"
            />
            <span className="mt-1.5 block text-xs text-muted">This name is what appears on the leaderboard.</span>
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-serif text-4xl tracking-tight">How do you want to work?</h1>
            <p className="mt-2 text-muted">Seniority, location style, and the industries you care about.</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Seniority</legend>
            <div className="flex flex-wrap gap-2">
              {SENIORITY_OPTIONS.map((option) => (
                <Choice key={option} active={seniority === option} onClick={() => setSeniority(option)}>
                  {option}
                </Choice>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Work style</legend>
            <div className="flex flex-wrap gap-2">
              {WORK_STYLES.map((option) => (
                <Choice key={option} active={workStyle === option} onClick={() => setWorkStyle(option)}>
                  {option}
                </Choice>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Industries</legend>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.map((option) => (
                <Choice key={option} active={industries.includes(option)} onClick={() => toggleIndustry(option)}>
                  {option}
                </Choice>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customIndustry}
                onChange={(event) => setCustomIndustry(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomIndustry();
                  }
                }}
                className={fieldClass}
                placeholder="Add another industry"
              />
              <button type="button" onClick={addCustomIndustry} className="rounded-full border border-line px-4 text-sm">
                Add
              </button>
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight">Which skills should we watch for?</h1>
            <p className="mt-2 text-muted">Press enter after each one. These show up in your reviews.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={skillDraft}
              onChange={(event) => setSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              className={fieldClass}
              placeholder="Figma, SQL, stakeholder workshops"
            />
            <button type="button" onClick={addSkill} className="rounded-full border border-line px-4 text-sm">
              Add
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  onClick={() => setSkills((current) => current.filter((item) => item !== skill))}
                  className="rounded-full bg-ink px-3 py-1 text-sm text-paper"
                >
                  {skill} <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove {skill}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight">Where is your expertise?</h1>
            <p className="mt-2 text-muted">A few sentences on the work you are genuinely deep in.</p>
          </div>
          <textarea
            value={expertise}
            onChange={(event) => setExpertise(event.target.value)}
            rows={6}
            className={fieldClass}
            placeholder="I design onboarding for complex B2B tools, and I am strongest when research, product, and engineering have to agree on one flow."
          />
          <p className="text-xs text-muted">{expertise.trim().length}/800</p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="text-sm text-muted disabled:opacity-40"
          disabled={step === 0}
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={nextStep} className="rounded-full bg-ink px-5 py-3 text-sm text-paper">
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={pending}
            className="rounded-full bg-clay px-5 py-3 text-sm font-medium text-paper disabled:opacity-60"
          >
            {pending ? "Saving…" : "Go to dashboard"}
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
