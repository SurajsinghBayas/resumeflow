import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { readSession } from "@/lib/auth";
import { getLeaderboard, getProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.id).catch(() => null);
  if (!profile?.onboarded) redirect("/onboarding");
  const entries = await getLeaderboard(session.id).catch(() => []);
  const you = entries.find((entry) => entry.isYou);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar user={{ name: session.name, email: session.email }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:py-8">
        <h1 className="font-serif text-3xl tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">Ranked by the highest score on each resume.</p>
        {you ? (
          <p className="mt-4 rounded-2xl bg-moss px-4 py-3 text-sm text-forest">
            Your resume is rank {you.rank} with a score of {you.score}.
          </p>
        ) : (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
            Run a review to see where your resume ranks.
          </p>
        )}
        {entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No ranked resumes yet.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-2 sm:hidden">
              {entries.map((entry, index) => (
                <li
                  key={`${entry.rank}-${index}`}
                  className={`rounded-2xl border px-4 py-3 ${entry.isYou ? "border-ink bg-moss" : "border-line bg-card"}`}
                >
                  <p className="text-sm font-medium">
                    #{entry.rank} · {entry.score}
                    {entry.isYou && <span className="ml-2 text-xs text-forest">You</span>}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted">{entry.role}</p>
                  <p className="mt-1 truncate text-sm">
                    {entry.linkedinHref ? (
                      <a href={entry.linkedinHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        {entry.linkedinName}
                      </a>
                    ) : (
                      entry.linkedinName
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 hidden overflow-x-auto rounded-3xl border border-line bg-card sm:block">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">LinkedIn</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={`${entry.rank}-${index}`} className={entry.isYou ? "bg-moss" : undefined}>
                      <td className="px-4 py-3 font-medium">{entry.rank}</td>
                      <td className="px-4 py-3">
                        {entry.linkedinHref ? (
                          <a href={entry.linkedinHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                            {entry.linkedinName}
                          </a>
                        ) : (
                          entry.linkedinName
                        )}
                        {entry.isYou && <span className="ml-2 text-xs text-forest">You</span>}
                      </td>
                      <td className="px-4 py-3">{entry.role}</td>
                      <td className="px-4 py-3">{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
