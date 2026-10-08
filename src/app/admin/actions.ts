"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/auth";
import type { Plan } from "@/lib/plan";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/merchants");
}

/** Change a merchant's plan. Never touches other superadmins. */
export async function setMerchantPlan(
  userId: string,
  plan: Plan,
): Promise<void> {
  await requireSuperadmin();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { store: { select: { slug: true } } },
  });
  await prisma.user.updateMany({
    where: { id: userId, role: "merchant" },
    data: { plan },
  });
  revalidateAdmin();
  if (target?.store) revalidatePath(`/s/${target.store.slug}`);
}

export async function setBillingPaid(
  userId: string,
  paid: boolean,
): Promise<void> {
  await requireSuperadmin();
  await prisma.user.updateMany({
    where: { id: userId, role: "merchant" },
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
    select: { store: { select: { slug: true } } },
  });
  await prisma.user.updateMany({
    where: { id: userId, role: "merchant" },
    data: { active },
  });
  revalidateAdmin();
  if (target?.store) revalidatePath(`/s/${target.store.slug}`);
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
