"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { randomInt } from "node:crypto";
import { requireSuperadmin, hashPassword } from "@/lib/auth";
import type { Plan } from "@/lib/plan";
import { deleteAccountFully, deleteStoreFully } from "@/server/stores";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/merchants");
}

/** Accounts whose plan and payment the platform owner manages. */
const PLAN_ROLES = ["merchant", "superadmin"] as const;

/** Change an account's plan (shop accounts, and the owner's own stores). */
export async function setMerchantPlan(
  userId: string,
  plan: Plan,
): Promise<void> {
  await requireSuperadmin();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { stores: { select: { slug: true } } },
  });
  await prisma.user.updateMany({
    where: { id: userId, role: { in: [...PLAN_ROLES] } },
    data: { plan, requestedPlan: null, planRequestedAt: null },
  });
  revalidateAdmin();
  for (const s of target?.stores ?? []) revalidatePath(`/s/${s.slug}`);
}

export async function setBillingPaid(
  userId: string,
  paid: boolean,
): Promise<void> {
  await requireSuperadmin();
  await prisma.user.updateMany({
    where: { id: userId, role: { in: [...PLAN_ROLES] } },
    data: { billingPaid: paid },
  });
  revalidateAdmin();
}

/** Activate or suspend a merchant account (also affects their storefront). */
export async function setAccountActive(
  userId: string,
  active: boolean,
): Promise<void> {
  await requireSuperadmin();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { stores: { select: { slug: true } } },
  });
  await prisma.user.updateMany({
    where: { id: userId, role: "merchant" },
    data: { active },
  });
  revalidateAdmin();
  for (const s of target?.stores ?? []) revalidatePath(`/s/${s.slug}`);
}

export async function markSupportHandled(
  id: string,
  handled: boolean,
): Promise<void> {
  await requireSuperadmin();
  await prisma.supportRequest.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

/** Approve a merchant's requested plan: it becomes their plan, marked paid. */
export async function approvePlanRequest(userId: string): Promise<void> {
  await requireSuperadmin();
  const target = await prisma.user.findFirst({
    where: { id: userId, role: "merchant" },
    select: { requestedPlan: true, stores: { select: { slug: true } } },
  });
  if (!target?.requestedPlan) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: target.requestedPlan,
      billingPaid: true,
      requestedPlan: null,
      planRequestedAt: null,
    },
  });
  revalidateAdmin();
  revalidatePath("/dashboard", "layout");
  for (const s of target.stores) revalidatePath(`/s/${s.slug}`);
}

/** Decline a merchant's plan request; they stay on their current plan. */
export async function declinePlanRequest(userId: string): Promise<void> {
  await requireSuperadmin();
  await prisma.user.updateMany({
    where: { id: userId, role: "merchant" },
    data: { requestedPlan: null, planRequestedAt: null },
  });
  revalidateAdmin();
  revalidatePath("/dashboard", "layout");
}

/** Delete a merchant's storefront and everything in it. Their account stays. */
export async function deleteMerchantStore(
  storeId: string,
): Promise<{ error?: string }> {
  await requireSuperadmin();
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, slug: true },
  });
  if (!store) return { error: "Store not found." };
  await deleteStoreFully(store.id);
  revalidateAdmin();
  revalidatePath(`/s/${store.slug}`, "layout");
  revalidatePath("/dashboard", "layout");
  return {};
}

/** How long a one-time password code works. */
const RESET_CODE_MINUTES = 5;

/**
 * Make a fresh 6-digit one-time code for a forgot-password request. Only its
 * hash is stored, so the code is shown to the superadmin once, right now.
 */
export async function generateResetCode(
  requestId: string,
): Promise<{ error?: string; code?: string; expiresAt?: string }> {
  await requireSuperadmin();
  const request = await prisma.passwordReset.findUnique({
    where: { id: requestId },
    select: { id: true, usedAt: true, userId: true },
  });
  if (!request || request.usedAt)
    return { error: "This request is no longer open." };
  if (!request.userId)
    return { error: "No account uses this email, so there is nothing to reset." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000);
  await prisma.passwordReset.update({
    where: { id: request.id },
    data: {
      codeHash: await hashPassword(code),
      codeExpiresAt: expiresAt,
      attempts: 0,
    },
  });
  revalidatePath("/admin");
  return { code, expiresAt: expiresAt.toISOString() };
}

/** Close a forgot-password request without giving out a code. */
export async function dismissPasswordReset(requestId: string): Promise<void> {
  await requireSuperadmin();
  await prisma.passwordReset.deleteMany({ where: { id: requestId } });
  revalidatePath("/admin", "layout");
}

/**
 * Delete a shop account for good, with all of its stores. Only ordinary shop
 * accounts can be deleted here, never the platform owner's.
 */
export async function deleteMerchantAccount(
  userId: string,
): Promise<{ error?: string }> {
  await requireSuperadmin();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, stores: { select: { slug: true } } },
  });
  if (!target) return { error: "Account not found." };
  if (target.role !== "merchant")
    return { error: "This account can't be deleted from here." };
  await deleteAccountFully(userId);
  revalidateAdmin();
  revalidatePath("/admin", "layout");
  for (const s of target.stores) revalidatePath(`/s/${s.slug}`, "layout");
  return {};
}
