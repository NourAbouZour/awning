"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore, getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { Plan } from "@/lib/plan";

export interface SettingsInput {
  name: string;
  slug: string;
  contactEmail: string;
  phone: string;
  address: string;
  hours: string;
  currency: string;
  shippingNote: string;
}

export async function saveSettings(
  input: SettingsInput,
): Promise<{ error?: string }> {
  const store = await requireCurrentStore();

  if (input.name.trim().length < 2) return { error: "Your store needs a name." };
  const slug = slugify(input.slug);
  if (!slug) return { error: "Your store address can't be empty." };

  const clash = await prisma.store.findFirst({
    where: { slug, NOT: { id: store.id } },
    select: { id: true },
  });
  if (clash) return { error: "That store address is already taken." };

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: input.name.trim(),
      slug,
      contactEmail: input.contactEmail,
      phone: input.phone,
      address: input.address,
      hours: input.hours,
      currency: input.currency,
      shippingNote: input.shippingNote,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/s/${slug}`);
  return {};
}

/** A merchant chooses their own plan. Payment stays manual (billingPaid is
 *  confirmed by the platform owner in the admin panel). */
export async function setOwnPlan(plan: Plan): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  await prisma.user.update({ where: { id: user.id }, data: { plan } });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  return {};
}
