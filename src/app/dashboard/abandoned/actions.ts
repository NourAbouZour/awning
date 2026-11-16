"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertFeature, requireCurrentStore } from "@/lib/auth";

export interface AbandonedActionState {
  error?: string;
}

/** Hides a cart from the list, used for both "recovered" and "dismiss". */
export async function markCartRecovered(
  id: string,
): Promise<AbandonedActionState> {
  await assertFeature("abandonedCart");
  const store = await requireCurrentStore();
  const { count } = await prisma.abandonedCart.updateMany({
    where: { id, storeId: store.id },
    data: { recovered: true },
  });
  if (count === 0) return { error: "Cart not found." };
  revalidatePath("/dashboard/abandoned");
  return {};
}
