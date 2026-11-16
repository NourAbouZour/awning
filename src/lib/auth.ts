import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "@/lib/session";
import { hasFeature, type Feature, type Plan } from "@/lib/plan";

/** Which of an owner's stores the dashboard is working on (Arcade can own several). */
export const ACTIVE_STORE_COOKIE = "sl_store";

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

/** The logged-in user, or null. Cached for the length of one request. */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  // A suspended account is treated as logged out everywhere.
  return user && user.active ? user : null;
});

/**
 * The store the dashboard is working on, or null. Staff get the store they
 * belong to; owners get the store picked in the store switcher, falling back
 * to their first store.
 */
export const getCurrentStore = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "staff") {
    return user.staffStoreId
      ? prisma.store.findUnique({ where: { id: user.staffStoreId } })
      : null;
  }
  const jar = await cookies();
  const wanted = jar.get(ACTIVE_STORE_COOKIE)?.value;
  if (wanted) {
    const picked = await prisma.store.findFirst({
      where: { id: wanted, userId: user.id },
    });
    if (picked) return picked;
  }
  return prisma.store.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
});

/** The plan of the current store's owner (staff inherit it). */
export const getCurrentPlan = cache(async (): Promise<Plan> => {
  const store = await getCurrentStore();
  if (!store) return "stall";
  const owner = await prisma.user.findUnique({
    where: { id: store.userId },
    select: { plan: true },
  });
  return (owner?.plan as Plan) ?? "stall";
});

/** Whether the current store's plan includes a feature. */
export async function currentHasFeature(feature: Feature): Promise<boolean> {
  return hasFeature(await getCurrentPlan(), feature);
}

/** Throws unless the current store's plan includes the feature (for server actions). */
export async function assertFeature(feature: Feature): Promise<void> {
  if (!(await currentHasFeature(feature))) {
    throw new Error("Your plan doesn't include this feature.");
  }
}

/** True when the logged-in user owns the current store (not staff). */
export async function isStoreOwner(): Promise<boolean> {
  const [user, store] = await Promise.all([getCurrentUser(), getCurrentStore()]);
  return !!user && !!store && store.userId === user.id;
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
