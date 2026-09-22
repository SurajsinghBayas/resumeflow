import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createSession, revokeSession, sessionActive } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "rf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is missing. Add it to .env.local.");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser) {
  const jti = randomUUID();
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
  return { token, jti };
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    if (typeof payload.jti !== "string" || !(await sessionActive(payload.jti))) {
      return null;
    }
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export async function writeSession(user: SessionUser) {
  const { token, jti } = await signSession(user);
  await createSession(jti, user.id, new Date(Date.now() + SESSION_TTL_MS));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      if (typeof payload.jti === "string") await revokeSession(payload.jti);
    } catch {
      // Invalid token: nothing to revoke, just clear the cookie.
    }
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
