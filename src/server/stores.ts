import { prisma } from "@/lib/db";
import { toStore } from "@/server/adapters";
import type { Store } from "@/lib/types";

const fullInclude = {
  theme: true,
  user: { select: { plan: true } },
  categories: { orderBy: { name: "asc" } },
  products: {
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  },
} as const;

/** What shoppers see: products without a collection are left out. */
const publicInclude = {
  ...fullInclude,
  products: {
    where: { categoryId: { not: null } },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  },
} as const;

/** A store as the public storefront sees it. */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const row = await prisma.store.findUnique({
    where: { slug },
    include: publicInclude,
  });
  return row ? toStore(row) : null;
}

/** A store with every product, for its own dashboard. */
export async function getStoreById(id: string): Promise<Store | null> {
  const row = await prisma.store.findUnique({
    where: { id },
    include: fullInclude,
  });
  return row ? toStore(row) : null;
}

/** The userId that owns a store (by slug), or null. */
export async function getStoreOwnerId(slug: string): Promise<string | null> {
  const row = await prisma.store.findUnique({
    where: { slug },
    select: { userId: true },
  });
  return row?.userId ?? null;
}

/** The owning account's id and active status for a store, or null. */
export async function getStoreOwner(
  slug: string,
): Promise<{ userId: string; active: boolean } | null> {
  const row = await prisma.store.findUnique({
    where: { slug },
    select: { user: { select: { id: true, active: true } } },
  });
  return row ? { userId: row.user.id, active: row.user.active } : null;
}

export async function listStores(): Promise<Store[]> {
  const rows = await prisma.store.findMany({
    include: publicInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toStore);
}

/**
 * Delete a store and everything that belongs to it: products, collections,
 * orders, customers, messages, subscribers, discounts and staff accounts.
 * The owner's own account is kept. This cannot be undone.
 */
export async function deleteStoreFully(storeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Orders hold a RESTRICT link to customers, so they go first.
    await tx.order.deleteMany({ where: { storeId } });
    await tx.store.delete({ where: { id: storeId } });
  });
}

/**
 * Delete an account with every store it owns and everything inside them
 * (including those stores' staff logins). This cannot be undone.
 */
export async function deleteAccountFully(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Orders hold a RESTRICT link to customers, so they go first.
    await tx.order.deleteMany({ where: { store: { userId } } });
    await tx.user.delete({ where: { id: userId } });
  });
}
