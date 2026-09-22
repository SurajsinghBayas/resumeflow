import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardApp } from "@/components/dashboard-app";
import { NavBar } from "@/components/nav-bar";
import { readSession } from "@/lib/auth";
import { countAnalysesToday, getProfile } from "@/lib/db";
import { CONTACT_LINKEDIN_URL, MAX_REVIEWS_PER_DAY } from "@/lib/limits";
import { gatewayConfigured } from "@/lib/llm";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  const loaded = await loadDashboard(session.id);
  if ("error" in loaded) {
    return (
      <div className="flex flex-1 flex-col">
        <NavBar user={{ name: session.name, email: session.email }} />
        <main className="mx-auto w-full max-w-lg flex-1 px-5 py-16">
          <h1 className="font-serif text-4xl">The desk could not open</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{loaded.error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <NavBar user={{ name: session.name, email: session.email }} />
      <DashboardApp
        user={session}
        profile={loaded.profile}
        gatewayConfigured={gatewayConfigured()}
        reviewLimit={MAX_REVIEWS_PER_DAY}
        initialRemaining={loaded.remaining}
        contactUrl={CONTACT_LINKEDIN_URL}
      />
    </div>
  );
}

async function loadDashboard(
  userId: string,
): Promise<{ profile: Profile; remaining: number } | { error: string }> {
  try {
    const profile = await getProfile(userId);
    if (!profile?.onboarded || !profile.linkedin.trim()) redirect("/onboarding");
    const usedToday = await countAnalysesToday(userId);
    return {
      profile,
      remaining: Math.max(0, MAX_REVIEWS_PER_DAY - usedToday),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "The database could not be reached.",
    };
  }
}
