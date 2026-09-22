import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { ReviewsBrowser } from "@/components/reviews-browser";
import { readSession } from "@/lib/auth";
import { getProfile, listAnalyses } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.id).catch(() => null);
  if (!profile?.onboarded) redirect("/onboarding");
  const analyses = await listAnalyses(session.id).catch(() => []);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar user={{ name: session.name, email: session.email }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:py-8">
        <h1 className="font-serif text-3xl tracking-tight">Past reviews</h1>
        <p className="mt-1 text-sm text-muted">Every review you have run, newest first.</p>
        <ReviewsBrowser initialAnalyses={analyses} />
      </main>
    </div>
  );
}
