import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "tavi_session";

export type SessionUser = {
  id: string;
  email: string;
  nickname: string;
  role: "user" | "moderator" | "admin" | "super_admin";
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET is not configured");

  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const key = secret();
  if (!key) return null;

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    return {
      id: String(payload.id ?? payload.sub),
      email: String(payload.email),
      nickname: String(payload.nickname),
      role: payload.role as SessionUser["role"]
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: SessionUser | null) {
  return user?.role === "admin" || user?.role === "super_admin";
}

