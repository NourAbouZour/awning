import { PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { currentHasFeature, requireCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AbandonedClient,
  type AbandonedCartRow,
  type AbandonedItem,
} from "./abandoned-client";

/** The items column is free-form JSON; keep only well-formed lines. */
function parseItems(raw: unknown): AbandonedItem[] {
  if (!Array.isArray(raw)) return [];
  const out: AbandonedItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title : "";
    if (!title) continue;
    const quantity = Number(r.quantity);
    const price = Number(r.price);
    out.push({
      title,
      variant: typeof r.variant === "string" && r.variant ? r.variant : null,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      price: Number.isFinite(price) ? price : 0,
    });
  }
  return out;
}

export default async function AbandonedCartsPage() {
  const store = await requireCurrentStore();
  if (!(await currentHasFeature("abandonedCart"))) {
    return (
      <>
        <PageHeader
          title="Abandoned carts"
          sub="Shoppers who started checkout but didn't place the order."
        />
        <LockedFeature
          feature="abandonedCart"
          title="Win back unfinished orders"
          description="When a shopper fills in their details at checkout but leaves before ordering, their cart shows up here. Send them a friendly WhatsApp reminder in one tap."
        />
      </>
    );
  }

  const rows = await prisma.abandonedCart.findMany({
    where: { storeId: store.id, recovered: false },
    orderBy: { createdAt: "desc" },
  });

  const carts: AbandonedCartRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    items: parseItems(c.items),
    subtotal: Number(c.subtotal.toString()),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AbandonedClient
      carts={carts}
      storeName={store.name}
      currency={store.currency}
    />
  );
}
