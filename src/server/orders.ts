import { prisma } from "@/lib/db";
import { toOrder } from "@/server/adapters";
import type { Order } from "@/lib/types";

const orderInclude = { items: true } as const;

export async function listOrders(storeId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { storeId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getOrderById(
  storeId: string,
  id: string,
): Promise<Order | null> {
  const row = await prisma.order.findFirst({
    where: { id, storeId },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

export async function getOrderByNumber(
  storeId: string,
  number: string,
): Promise<Order | null> {
  const row = await prisma.order.findFirst({
    where: { storeId, number },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

/** A 30-day daily revenue series for the dashboard, computed from orders. */
export async function getRevenueSeries(
  storeId: string,
  days = 30,
): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const rows = await prisma.order.findMany({
    where: { storeId, createdAt: { gte: since } },
    select: { total: true, createdAt: true },
  });

  // Key by LOCAL date (the window start and labels are local), so an order
  // placed "today" lands in today's bucket regardless of timezone.
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(key(d), { revenue: 0, orders: 0 });
  }
  for (const o of rows) {
    const b = buckets.get(key(o.createdAt));
    if (b) {
      b.revenue += Number(o.total.toString());
      b.orders += 1;
    }
  }

  const label = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return [...buckets.entries()].map(([iso, b]) => ({
    date: label(iso),
    revenue: Math.round(b.revenue),
    orders: b.orders,
  }));
}
