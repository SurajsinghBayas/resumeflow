import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { readSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8">
      <Logo />
      <div className="mt-10">
        <OnboardingWizard initial={profile} />
      </div>
    </main>
  );
}
