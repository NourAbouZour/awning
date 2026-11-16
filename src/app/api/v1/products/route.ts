import { prisma } from "@/lib/db";
import { authenticate } from "../auth";

export const dynamic = "force-dynamic";

const SITE = "https://shopleb.com";

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { store } = auth;

  const rows = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });

  const products = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    compareAt: p.compareAt == null ? null : Number(p.compareAt),
    currency: store.currency,
    inventory: p.inventory,
    status: p.status,
    sku: p.sku,
    images: Array.isArray(p.images)
      ? p.images.filter((i): i is string => typeof i === "string")
      : [],
    url: `${SITE}/s/${store.slug}/product/${p.slug}`,
    variantLabel: p.variantGroupLabel,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price == null ? null : Number(v.price),
      stock: v.stock,
      isDefault: v.isDefault,
    })),
  }));

  return Response.json({ products });
}
