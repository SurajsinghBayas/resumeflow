import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { readSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function LoginPage() {
  const session = await readSession();
  if (session) {
    const profile = await getProfile(session.id);
    redirect(profile?.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell title="Welcome back" lede="Log in to review a resume against the role you are chasing.">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
