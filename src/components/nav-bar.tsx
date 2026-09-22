"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/logo";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeViewport(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function NavBar({
  user,
  action,
  activeView,
}: {
  user?: { name: string; email: string } | null;
  action?: { href: string; label: string };
  activeView?: "reviews" | "leaderboard";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(pathname);
  // Source of truth for which layout to render: the live viewport, not
  // CSS alone — so a menu opened on mobile can never leak into desktop
  // layout after a resize, and vice versa.
  const isDesktop = useSyncExternalStore(subscribeViewport, getDesktopSnapshot, () => true);

  // Reset the mobile menu on navigation (render-time adjustment, no effect).
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setMenuOpen(false);
  }
  // Derived: growing to desktop implicitly closes the mobile menu.
  const showMenu = menuOpen && !isDesktop;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const links = user
    ? [
        {
          href: "/dashboard?view=reviews",
          label: "Past reviews",
          active: pathname === "/dashboard" && activeView !== "leaderboard",
        },
        {
          href: "/dashboard?view=leaderboard",
          label: "Leaderboard",
          active: pathname === "/dashboard" && activeView === "leaderboard",
        },
        {
          href: "/onboarding",
          label: "Preferences",
          active: pathname === "/onboarding",
        },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo />

        {isDesktop && links.length > 0 && (
          <nav className="flex items-center gap-1" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  link.active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-card hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {isDesktop && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span
                  className="hidden max-w-56 truncate text-sm text-muted lg:block"
                  title={user.email}
                >
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
        )}

        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={showMenu}
            aria-label={showMenu ? "Close menu" : "Open menu"}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {showMenu ? (
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
            {showMenu ? "Close" : "Menu"}
          </button>
        )}
      </div>

      {showMenu && (
        <nav className="space-y-1 border-t border-line px-5 py-3" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={link.active ? "page" : undefined}
              className={`block rounded-xl px-3 py-2.5 text-sm ${
                link.active ? "bg-ink text-paper" : "text-muted hover:bg-card hover:text-ink"
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
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-center text-sm"
              >
                Log in
              </Link>
              {action && (
                <Link
                  href={action.href}
                  onClick={() => setMenuOpen(false)}
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
