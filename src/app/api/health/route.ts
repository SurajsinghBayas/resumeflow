import { ensureSchema, pool } from "@/lib/db";

export async function GET() {
  let db: "up" | "down" = "down";
  try {
    await ensureSchema();
    await pool.query("select 1");
    db = "up";
  } catch {
    db = "down";
  }
  return Response.json(
    { ok: db === "up", db, time: new Date().toISOString() },
    { status: db === "up" ? 200 : 503 },
  );
}
