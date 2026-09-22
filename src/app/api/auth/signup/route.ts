import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { writeSession } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Use your name, a valid email, and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = {
    id: randomUUID(),
    email,
    name: parsed.data.name,
  };
  await createUser({
    ...user,
    passwordHash: await bcrypt.hash(parsed.data.password, 12),
  });
  await writeSession(user);
  return Response.json({ ok: true });
}
