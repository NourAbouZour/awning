"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const store = await requireCurrentStore();
  const res = await prisma.order.updateMany({
    where: { id: orderId, storeId: store.id },
    data: { status },
  });
  if (res.count === 0) return { error: "Order not found." };
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
  return {};
}
