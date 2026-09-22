import { readSession } from "@/lib/auth";
import { getLeaderboard } from "@/lib/db";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in to see the leaderboard." }, { status: 401 });
  }
  const entries = await getLeaderboard(session.id);
  return Response.json({ entries });
}
