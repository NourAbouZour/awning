"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";

/** Remove one person from this store's newsletter list. */
export async function removeSubscriber(id: string): Promise<{ error?: string }> {
  const store = await requireCurrentStore();
  const res = await prisma.subscriber.deleteMany({
    where: { id, storeId: store.id },
  });
  if (res.count === 0) return { error: "Subscriber not found." };
  revalidatePath("/dashboard/subscribers");
  revalidatePath("/dashboard/email");
  return {};
}
