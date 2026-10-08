import { prisma } from "@/lib/db";
import { toStore } from "@/server/adapters";
import type { Store } from "@/lib/types";

const fullInclude = {
  theme: true,
  categories: { orderBy: { name: "asc" } },
  products: {
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  },
} as const;

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const row = await prisma.store.findUnique({
    where: { slug },
    include: fullInclude,
  });
  return row ? toStore(row) : null;
}

export async function getStoreForUser(userId: string): Promise<Store | null> {
  const row = await prisma.store.findUnique({
    where: { userId },
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
    include: fullInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toStore);
}
