"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  requireCurrentStore,
  getCurrentUser,
  isStoreOwner,
  ACTIVE_STORE_COOKIE,
} from "@/lib/auth";
import { deleteStoreFully } from "@/server/stores";
import { slugify } from "@/lib/utils";
import type { Plan } from "@/lib/plan";
import { extractEmbedSrc } from "@/lib/maps";

export interface SettingsInput {
  name: string;
  slug: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  mapsUrl: string;
  mapsEmbed: string;
  hours: string;
  currency: string;
  shippingNote: string;
  freeShipping: string;
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

  const mapsUrl = input.mapsUrl.trim();
  if (mapsUrl && !/^https:\/\//i.test(mapsUrl))
    return { error: "The Google Maps link should start with https://" };
  // Keep only the embed URL, and only if it really is a Google Maps embed.
  const mapsEmbed = input.mapsEmbed.trim();
  const embedSrc = extractEmbedSrc(mapsEmbed);
  if (mapsEmbed && !embedSrc)
    return {
      error:
        "That doesn't look like Google Maps embed code. In Google Maps choose Share, then Embed a map, and copy the HTML.",
    };

  const freeShippingNum = Number(input.freeShipping);
  const freeShipping =
    input.freeShipping.trim() !== "" &&
    Number.isFinite(freeShippingNum) &&
    freeShippingNum >= 0
      ? new Prisma.Decimal(freeShippingNum)
      : null;

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: input.name.trim(),
      slug,
      contactEmail: input.contactEmail,
      phone: input.phone,
      address: input.address,
      city: input.city.trim() || null,
      district: input.district.trim() || null,
      mapsUrl: mapsUrl || null,
      mapsEmbed: embedSrc,
      hours: input.hours,
      currency: input.currency,
      shippingNote: input.shippingNote,
      freeShipping,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/s/${slug}`);
  return {};
}

/**
 * A merchant asks for a plan. Moving down to the free Stall plan happens at
 * once; a paid plan waits for the platform owner to approve it in /admin
 * (payment is arranged by hand, by Whish or cash).
 */
export async function setOwnPlan(plan: Plan): Promise<{ error?: string; pending?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  if (user.role === "staff")
    return { error: "Only the store owner can change the plan." };
  if (user.role === "superadmin") {
    // The platform owner approves plans, so their own change applies at once.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan,
        billingPaid: plan !== "stall",
        requestedPlan: null,
        planRequestedAt: null,
      },
    });
    revalidatePath("/dashboard", "layout");
    revalidatePath("/admin", "layout");
    return { pending: false };
  }

  if (plan === user.plan) {
    // Picking the current plan again withdraws any pending request.
    await prisma.user.update({
      where: { id: user.id },
      data: { requestedPlan: null, planRequestedAt: null },
    });
  } else if (plan === "stall") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan,
        billingPaid: false,
        requestedPlan: null,
        planRequestedAt: null,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { requestedPlan: plan, planRequestedAt: new Date() },
    });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/merchants");
  return { pending: plan !== "stall" && plan !== user.plan };
}

/**
 * The owner deletes the current store for good. They must type the store's
 * name to confirm. Their account stays, so they can open a new store later.
 */
export async function deleteOwnStore(
  confirmName: string,
): Promise<{ error?: string }> {
  const store = await requireCurrentStore();
  if (!(await isStoreOwner()))
    return { error: "Only the store owner can delete the store." };
  if (confirmName.trim().toLowerCase() !== store.name.trim().toLowerCase())
    return { error: "The name doesn't match. Type your store name exactly." };

  await deleteStoreFully(store.id);

  const jar = await cookies();
  jar.delete(ACTIVE_STORE_COOKIE);
  revalidatePath(`/s/${store.slug}`, "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin/merchants");

  const another = await prisma.store.findFirst({
    where: { userId: store.userId },
    select: { id: true },
  });
  redirect(another ? "/dashboard" : "/onboarding");
}
