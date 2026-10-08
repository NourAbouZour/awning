"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";

export async function markMessageRead(id: string): Promise<void> {
  const store = await requireCurrentStore();
  await prisma.contactMessage.updateMany({
    where: { id, storeId: store.id },
    data: { read: true },
  });
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard");
}
