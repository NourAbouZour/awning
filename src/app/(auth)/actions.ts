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
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  if (!user.active) {
    return { error: "Your account is suspended — please contact support." };
  }

  await createSession(user.id);
  if (user.role === "superadmin") redirect("/admin");
  const store = await prisma.store.findUnique({ where: { userId: user.id } });
  redirect(store ? "/dashboard" : "/onboarding");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Tell us your name — 2+ characters." };
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
