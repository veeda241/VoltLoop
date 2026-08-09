import { cookies } from "next/headers";
import { randomToken, sha256Hex } from "@/lib/crypto-hash";
import { mutateStore, readStore } from "@/lib/store/demo-store";
import type { User, UserRole } from "@/lib/store/types";
import { toPublicUser, type PublicUser } from "@/lib/public-user";

export const SESSION_COOKIE = "vl_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function hashPassword(password: string) {
  return sha256Hex(password);
}

export async function createSession(userId: string) {
  const token = randomToken();
  mutateStore((s) => {
    s.sessions.push({ token, user_id: userId, created_at: new Date().toISOString() });
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    mutateStore((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token);
    });
  }
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = readStore();
  const sess = store.sessions.find((s) => s.token === token);
  if (!sess) return null;
  return store.users.find((u) => u.id === sess.user_id) ?? null;
}

export async function requireUser(roles?: UserRole[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  if (roles && !roles.includes(user.role) && user.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function getPublicSession(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  return user ? toPublicUser(user) : null;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
