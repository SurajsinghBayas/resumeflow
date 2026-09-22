import bcrypt from "bcryptjs";
import { z } from "zod";
import { writeSession } from "@/lib/auth";
import { findUserByEmail, getProfile } from "@/lib/db";
import { checkRateLimit, rateLimitedResponse } from "@/lib/ratelimit";
import { clientIp, crossOriginResponse, isSameOrigin } from "@/lib/request";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return crossOriginResponse();
  const gate = checkRateLimit(`login:${clientIp(request)}`, 10, 60_000);
  if (!gate.allowed) return rateLimitedResponse(gate.resetMs);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter the email and password for your account." }, { status: 400 });
  }

  const user = await findUserByEmail(parsed.data.email.toLowerCase());
  const valid = user ? await bcrypt.compare(parsed.data.password, user.password_hash) : false;
  if (!user || !valid) {
    return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  await writeSession({ id: user.id, email: user.email, name: user.name });
  const profile = await getProfile(user.id);
  return Response.json({ ok: true, onboarded: Boolean(profile?.onboarded) });
}
