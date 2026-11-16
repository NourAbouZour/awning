"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export interface AuthState {
  error?: string;
  /** Login only: nobody has an account with this email. */
  noAccount?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { noAccount: email };
  if (!(await verifyPassword(password, user.passwordHash))) {
    return {
      error: 'That password isn\'t right. Try again, or press "Forgot it?".',
    };
  }
  if (!user.active) {
    return { error: "Your account is suspended, please contact support." };
  }

  await createSession(user.id);
  if (user.role === "superadmin") redirect("/admin");
  if (user.role === "staff") redirect("/dashboard");
  const store = await prisma.store.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  redirect(store ? "/dashboard" : "/onboarding");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Tell us your name, 2+ characters." };
  if (!EMAIL_RE.test(email))
    return { error: "That doesn't look like an email address." };
  if (password.length < 8)
    return { error: "Use a password of at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "That email is already in use. Try logging in." };
  }

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002")
      return { error: "That email is already in use. Try logging in." };
    throw e;
  }
  await createSession(user.id);
  redirect("/onboarding");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Forgot password                                                      */
/* ------------------------------------------------------------------ */

export interface ResetState {
  error?: string;
  /** The request reached the Shopleb team. */
  sent?: boolean;
  /** The password was changed. */
  done?: boolean;
}

const MAX_CODE_ATTEMPTS = 5;
const MAX_UNKNOWN_REQUESTS = 100;
const BAD_CODE =
  "That code isn't right or has expired. Ask the Shopleb team for a new one.";

/**
 * Step 1: the user says they forgot their password. Every request shows up
 * for the platform owner in /admin, who generates a one-time code for them.
 * An email with no account is recorded too (so the owner can tell the person
 * they used a different email), and the answer on screen is always the same.
 */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter your email address." };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  // One open request per person is enough; refresh it instead of piling up.
  const open = await prisma.passwordReset.findFirst({
    where: user
      ? { userId: user.id, usedAt: null }
      : { userId: null, email, usedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (open) {
    await prisma.passwordReset.update({
      where: { id: open.id },
      data: { createdAt: new Date(), email },
    });
  } else if (user) {
    await prisma.passwordReset.create({ data: { userId: user.id, email } });
  } else {
    // Unknown emails are kept too, up to a cap so the list can't be flooded.
    const unknown = await prisma.passwordReset.count({
      where: { userId: null },
    });
    if (unknown < MAX_UNKNOWN_REQUESTS) {
      await prisma.passwordReset.create({ data: { email } });
    }
  }
  return { sent: true };
}

/**
 * Step 2: the user types the one-time code they were given plus a new
 * password. The code works once, for 5 minutes, and locks after 5 wrong tries.
 */
export async function resetPasswordWithCode(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter your email address." };
  if (code.length !== 6) return { error: "Enter the 6-digit code." };
  if (password.length < 8)
    return { error: "Use a new password of at least 8 characters." };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: BAD_CODE };

  const request = await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, codeHash: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (
    !request ||
    !request.codeHash ||
    !request.codeExpiresAt ||
    request.codeExpiresAt.getTime() < Date.now() ||
    request.attempts >= MAX_CODE_ATTEMPTS
  ) {
    return { error: BAD_CODE };
  }

  if (!(await verifyPassword(code, request.codeHash))) {
    await prisma.passwordReset.update({
      where: { id: request.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: BAD_CODE };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    }),
    // The code is spent, and any other open requests are closed with it.
    prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
  ]);
  return { done: true };
}
