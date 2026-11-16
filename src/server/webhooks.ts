import { createHmac } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasFeature, type Plan } from "@/lib/plan";

// Arcade: outgoing order webhooks and the order shape shared with the REST API.

const TIMEOUT_MS = 5000;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

const money = (v: Prisma.Decimal | null | undefined): number | null =>
  v == null ? null : Number(v);

/** Public JSON shape of an order (money as numbers, dates as ISO strings). */
export function serializeOrder(row: OrderWithItems) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    customer: {
      name: row.customerName,
      email: row.customerEmail,
      phone: row.customerPhone,
    },
    shippingAddress: row.shippingAddress,
    locationUrl: row.locationUrl,
    paymentMethod: row.paymentMethod,
    discountCode: row.discountCode,
    discountAmount: money(row.discountAmount),
    shippingFee: money(row.shippingFee),
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      title: item.title,
      variant: item.variant,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;

export interface DeliveryResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * POST a JSON payload to a webhook URL, signed with the store's API key when
 * it has one. Never throws; the outcome comes back as a result.
 */
export async function deliverWebhook(
  url: string,
  apiKey: string | null,
  event: string,
  payload: unknown,
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Shopleb-Webhooks/1.0",
    "X-Shopleb-Event": event,
  };
  if (apiKey) {
    headers["X-Shopleb-Signature"] = createHmac("sha256", apiKey)
      .update(body)
      .digest("hex");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: aborted
        ? "The webhook URL took longer than 5 seconds to answer."
        : "Couldn't reach the webhook URL.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tell the store's webhook URL about a new or changed order. Only runs when a
 * webhook URL is saved and the owner's plan includes the API. Never throws.
 */
export async function fireOrderWebhook(
  storeId: string,
  event: "order.created" | "order.updated",
  orderNumber: string,
): Promise<void> {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        slug: true,
        apiKey: true,
        webhookUrl: true,
        user: { select: { plan: true } },
      },
    });
    if (!store?.webhookUrl) return;
    if (!hasFeature(store.user.plan as Plan, "api")) return;

    const order = await prisma.order.findUnique({
      where: { storeId_number: { storeId, number: orderNumber } },
      include: { items: true },
    });
    if (!order) return;

    const result = await deliverWebhook(store.webhookUrl, store.apiKey, event, {
      event,
      store: store.slug,
      order: serializeOrder(order),
    });
    if (!result.ok) {
      console.error(
        `[webhooks] ${event} for order ${orderNumber} failed:`,
        result.error ?? `HTTP ${result.status}`,
      );
    }
  } catch (err) {
    console.error(`[webhooks] ${event} for order ${orderNumber} failed:`, err);
  }
}
