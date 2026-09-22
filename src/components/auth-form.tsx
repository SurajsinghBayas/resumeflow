"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-clay focus:ring-2 focus:ring-clay/20 sm:text-[15px]";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (signup && password !== String(form.get("confirm") ?? "")) {
      setError("Those passwords do not match.");
      return;
    }

    setPending(true);
    const response = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password,
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; onboarded?: boolean } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "Something went wrong. Try again.");
      return;
    }
    router.push(signup || body?.onboarded === false ? "/onboarding" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {signup && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Name</span>
          <input name="name" required autoComplete="name" className={fieldClass} placeholder="Maya Chen" />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          placeholder="you@studio.com"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={signup ? 8 : 1}
          autoComplete={signup ? "new-password" : "current-password"}
          className={fieldClass}
          placeholder={signup ? "At least 8 characters" : "Your password"}
        />
      </label>
      {signup && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Confirm password</span>
          <input name="confirm" type="password" required autoComplete="new-password" className={fieldClass} />
        </label>
      )}
      {error && (
        <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-clay-deep disabled:opacity-60"
      >
        {pending ? "Working…" : signup ? "Create account" : "Log in"}
      </button>
      <p className="text-center text-sm text-muted">
        {signup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-ink underline decoration-line underline-offset-4">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-ink underline decoration-line underline-offset-4">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
