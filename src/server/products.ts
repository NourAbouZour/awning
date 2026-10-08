import { prisma } from "@/lib/db";
import { toProduct } from "@/server/adapters";
import type { Product } from "@/lib/types";

export async function listProducts(storeId: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { storeId },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

export async function getProductById(
  storeId: string,
  id: string,
): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { id, storeId },
    include: { variants: true },
  });
  return row ? toProduct(row) : null;
}

export async function getProductBySlug(
  storeId: string,
  slug: string,
): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { storeId, slug },
    include: { variants: true },
  });
  return row ? toProduct(row) : null;
}
