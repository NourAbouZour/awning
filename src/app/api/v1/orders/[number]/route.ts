import { prisma } from "@/lib/db";
import { serializeOrder } from "@/server/webhooks";
import { authenticate } from "../../auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { store } = auth;

  // Order numbers are stored as "#1001". Accept "1001" or an encoded "%231001".
  const { number: raw } = await params;
  let number = raw.trim();
  try {
    number = decodeURIComponent(number);
  } catch {
    // Already decoded or malformed; use as is.
  }
  const candidates = number.startsWith("#") ? [number] : [`#${number}`, number];

  const order = await prisma.order.findFirst({
    where: { storeId: store.id, number: { in: candidates } },
    include: { items: true },
  });
  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({ order: serializeOrder(order) });
}
