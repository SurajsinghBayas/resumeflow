import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { readSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.id);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar user={{ name: session.name, email: session.email }} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8">
        <div className="mt-4">
          <OnboardingWizard initial={profile} />
        </div>
      </main>
    </div>
  );
}
