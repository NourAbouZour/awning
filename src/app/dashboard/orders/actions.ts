"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";
import { fireOrderWebhook } from "@/server/webhooks";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "fulfilled",
  "shipped",
  "cancelled",
];

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const store = await requireCurrentStore();
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    select: {
      id: true,
      number: true,
      status: true,
      items: { select: { productId: true, variant: true, quantity: true } },
    },
  });
  if (!order) return { error: "Order not found." };
  if (order.status === status) return {};

  // Cancelling puts the stock back; un-cancelling takes it again.
  const wasCancelled = order.status === "cancelled";
  const willCancel = status === "cancelled";
  const delta = willCancel ? 1 : wasCancelled ? -1 : 0;

  await prisma.$transaction(async (tx) => {
    if (delta !== 0) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) continue;
        const variant = item.variant
          ? product.variants.find((v) => v.name === item.variant)
          : undefined;
        const change = delta * item.quantity;
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: Math.max(0, variant.stock + change) },
          });
          const sum = await tx.productVariant.aggregate({
            where: { productId: product.id },
            _sum: { stock: true },
          });
          await tx.product.update({
            where: { id: product.id },
            data: { inventory: sum._sum.stock ?? 0 },
          });
        } else if (!product.variants.length) {
          await tx.product.update({
            where: { id: product.id },
            data: { inventory: Math.max(0, product.inventory + change) },
          });
        }
      }
    }
    await tx.order.update({ where: { id: order.id }, data: { status } });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
  if (delta !== 0) {
    revalidatePath("/dashboard/products");
    revalidatePath(`/s/${store.slug}`, "layout");
  }
  after(() => fireOrderWebhook(store.id, "order.updated", order.number));
  return {};
}
