import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "@/lib/session";

export { hashPassword, verifyPassword } from "@/lib/password";

/** Create a signed session cookie for the given user. */
export async function createSession(userId: string): Promise<void> {
  const token = await signSession({ userId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Clear the session cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Read and verify the current session, or null. */
export async function readSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** The logged-in user, or null. */
export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

/** The logged-in user's store (with id/slug/name), or null. */
export async function getCurrentStore() {
  const session = await readSession();
  if (!session) return null;
  return prisma.store.findUnique({ where: { userId: session.userId } });
}

/**
 * The logged-in user's store, or a redirect. Dashboard pages run under a
 * layout that already guarantees both, so this is a defensive narrowing that
 * also returns a non-null store for convenience.
 */
export async function requireCurrentStore() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  return store;
}

/** The current user if they are a superadmin, else a 404 (hides the area). */
export async function requireSuperadmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") notFound();
  return user;
}
