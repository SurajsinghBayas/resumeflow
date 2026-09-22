import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <Logo />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{lede}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}
