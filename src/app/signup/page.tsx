import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { readSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await readSession();
  if (session) redirect("/onboarding");

  return (
    <AuthShell
      title="Create your desk"
      lede="A few questions come next, then you can upload a resume and a job description."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
