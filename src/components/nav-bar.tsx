"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";

export function NavBar({
  user,
  action,
}: {
  user?: { name: string; email: string } | null;
  action?: { href: string; label: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/onboarding", label: "Preferences" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo />

        {links.length > 0 && (
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pathname === link.href
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-card hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <>
              <span className="max-w-48 truncate text-sm text-muted" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-line bg-card px-4 py-2 text-sm transition hover:bg-paper"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-2 text-sm text-muted hover:text-ink">
                Log in
              </Link>
              {action && (
                <Link
                  href={action.href}
                  className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-clay-deep"
                >
                  {action.label}
                </Link>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-full border border-line bg-card px-4 py-2 text-sm sm:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav className="space-y-1 border-t border-line px-5 py-3 sm:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`block rounded-xl px-3 py-2.5 text-sm ${
                pathname === link.href ? "bg-ink text-paper" : "text-muted hover:bg-card hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <p className="truncate px-3 pt-2 text-xs text-muted">{user.email}</p>
              <button
                type="button"
                onClick={logout}
                className="block w-full rounded-xl border border-line bg-card px-3 py-2.5 text-left text-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-center text-sm"
              >
                Log in
              </Link>
              {action && (
                <Link
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-ink px-3 py-2.5 text-center text-sm text-paper"
                >
                  {action.label}
                </Link>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
