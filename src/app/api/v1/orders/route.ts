import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/server/webhooks";
import { authenticate } from "../auth";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "fulfilled",
  "shipped",
  "cancelled",
];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { store } = auth;

  const params = new URL(request.url).searchParams;

  const statusParam = params.get("status");
  let status: OrderStatus | undefined;
  if (statusParam) {
    if (!STATUSES.includes(statusParam as OrderStatus)) {
      return Response.json(
        { error: `Unknown status. Use one of: ${STATUSES.join(", ")}.` },
        { status: 400 },
      );
    }
    status = statusParam as OrderStatus;
  }

  const limitParam = params.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitParam) {
    const n = Number.parseInt(limitParam, 10);
    if (!Number.isFinite(n) || n < 1) {
      return Response.json(
        { error: "limit must be a whole number from 1 to 200." },
        { status: 400 },
      );
    }
    limit = Math.min(n, MAX_LIMIT);
  }

  const rows = await prisma.order.findMany({
    where: { storeId: store.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: true },
  });

  return Response.json({ orders: rows.map(serializeOrder) });
}
