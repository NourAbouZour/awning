"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCurrentStore, getCurrentUser } from "@/lib/auth";
import { limitReached, FREE_PRODUCT_LIMIT, type Plan } from "@/lib/plan";

const LIMIT_MESSAGE = `You've reached ${FREE_PRODUCT_LIMIT} products on the free plan — upgrade to add more.`;

async function currentPlan(): Promise<Plan> {
  const user = await getCurrentUser();
  return (user?.plan as Plan) ?? "stall";
}

export interface VariantInput {
  name: string;
  price?: number | null;
  stock: number;
}

export interface ProductInput {
  id?: string;
  title: string;
  description: string;
  details?: string;
  price: number;
  compareAt?: number | null;
  inventory: number;
  sku: string;
  categoryId: string;
  status: "active" | "draft";
  images: string[];
  variantLabel?: string | null;
  variants: VariantInput[];
}

export interface ProductActionState {
  error?: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uniqueSlug(
  storeId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  // Loop until no other product in this store owns the slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.product.findFirst({
      where: {
        storeId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

function validate(input: ProductInput): string | null {
  if (!input.title || input.title.trim().length < 2)
    return "Give the product a name.";
  if (!(input.price > 0)) return "Set a price above zero.";
  if (input.compareAt != null && input.compareAt <= input.price)
    return "Compare-at should be higher than the price.";
  if (!input.categoryId) return "Pick a collection.";
  return null;
}

/** Keep only persistable image URLs (drop ephemeral blob: previews). */
function cleanImages(images: string[]): string[] {
  const kept = images.filter((u) => !u.startsWith("blob:"));
  return kept.length ? kept : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1400&auto=format&fit=crop"];
}

function cleanVariants(input: ProductInput) {
  if (!input.variantLabel || input.variants.length === 0) {
    return { variantGroupLabel: null, variants: [] as VariantInput[] };
  }
  const variants = input.variants
    .filter((v) => v.name.trim())
    .map((v) => ({
      name: v.name.trim(),
      price: v.price != null && v.price > 0 ? v.price : null,
      stock: Number.isFinite(v.stock) ? v.stock : 0,
    }));
  return { variantGroupLabel: input.variantLabel.trim(), variants };
}

async function assertCategory(storeId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });
  if (!cat) throw new Error("Collection does not belong to this store.");
}

export async function createProduct(
  input: ProductInput,
): Promise<ProductActionState> {
  const store = await requireCurrentStore();
  const err = validate(input);
  if (err) return { error: err };

  const count = await prisma.product.count({ where: { storeId: store.id } });
  if (limitReached(count, await currentPlan())) return { error: LIMIT_MESSAGE };

  await assertCategory(store.id, input.categoryId);

  const slug = await uniqueSlug(store.id, input.title);
  const { variantGroupLabel, variants } = cleanVariants(input);

  await prisma.product.create({
    data: {
      storeId: store.id,
      slug,
      title: input.title.trim(),
      description: input.description ?? "",
      details: input.details ?? "",
      price: new Prisma.Decimal(input.price),
      compareAt:
        input.compareAt != null ? new Prisma.Decimal(input.compareAt) : null,
      categoryId: input.categoryId,
      images: cleanImages(input.images) as unknown as Prisma.InputJsonValue,
      inventory: variants.length
        ? variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
        : Math.max(0, input.inventory | 0),
      sku: input.sku ?? "",
      status: input.status,
      variantGroupLabel,
      variants: variants.length
        ? {
            create: variants.map((v) => ({
              name: v.name,
              price: v.price != null ? new Prisma.Decimal(v.price) : null,
              stock: v.stock,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/s/${store.slug}`);
  redirect("/dashboard/products");
}

export async function updateProduct(
  input: ProductInput,
): Promise<ProductActionState> {
  const store = await requireCurrentStore();
  if (!input.id) return { error: "Missing product id." };
  const err = validate(input);
  if (err) return { error: err };

  const existing = await prisma.product.findFirst({
    where: { id: input.id, storeId: store.id },
    select: { id: true },
  });
  if (!existing) return { error: "Product not found." };
  await assertCategory(store.id, input.categoryId);

  const slug = await uniqueSlug(store.id, input.title, input.id);
  const { variantGroupLabel, variants } = cleanVariants(input);

  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId: input.id } }),
    prisma.product.update({
      where: { id: input.id },
      data: {
        slug,
        title: input.title.trim(),
        description: input.description ?? "",
        details: input.details ?? "",
        price: new Prisma.Decimal(input.price),
        compareAt:
          input.compareAt != null ? new Prisma.Decimal(input.compareAt) : null,
        categoryId: input.categoryId,
        images: cleanImages(input.images) as unknown as Prisma.InputJsonValue,
        inventory: variants.length
        ? variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
        : Math.max(0, input.inventory | 0),
        sku: input.sku ?? "",
        status: input.status,
        variantGroupLabel,
        variants: variants.length
          ? {
              create: variants.map((v) => ({
                name: v.name,
                price: v.price != null ? new Prisma.Decimal(v.price) : null,
                stock: v.stock,
              })),
            }
          : undefined,
      },
    }),
  ]);

  revalidatePath("/dashboard/products");
  revalidatePath(`/s/${store.slug}`);
  redirect("/dashboard/products");
}

async function ownedIds(storeId: string, ids: string[]): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { storeId, id: { in: ids } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function deleteProduct(id: string): Promise<void> {
  const store = await requireCurrentStore();
  const owned = await ownedIds(store.id, [id]);
  if (owned.length) await prisma.product.delete({ where: { id } });
  revalidatePath("/dashboard/products");
  revalidatePath(`/s/${store.slug}`);
}

export async function deleteProducts(ids: string[]): Promise<void> {
  const store = await requireCurrentStore();
  const owned = await ownedIds(store.id, ids);
  if (owned.length)
    await prisma.product.deleteMany({ where: { id: { in: owned } } });
  revalidatePath("/dashboard/products");
  revalidatePath(`/s/${store.slug}`);
}

export async function setProductsStatus(
  ids: string[],
  status: "active" | "draft",
): Promise<void> {
  const store = await requireCurrentStore();
  const owned = await ownedIds(store.id, ids);
  if (owned.length)
    await prisma.product.updateMany({
      where: { id: { in: owned } },
      data: { status },
    });
  revalidatePath("/dashboard/products");
  revalidatePath(`/s/${store.slug}`);
}

export async function duplicateProduct(
  id: string,
): Promise<ProductActionState> {
  const store = await requireCurrentStore();

  const count = await prisma.product.count({ where: { storeId: store.id } });
  if (limitReached(count, await currentPlan())) return { error: LIMIT_MESSAGE };

  const src = await prisma.product.findFirst({
    where: { id, storeId: store.id },
    include: { variants: true },
  });
  if (!src) return {};
  const slug = await uniqueSlug(store.id, `${src.title}-copy`);
  await prisma.product.create({
    data: {
      storeId: store.id,
      slug,
      title: `${src.title} (copy)`,
      description: src.description,
      details: src.details,
      price: src.price,
      compareAt: src.compareAt,
      categoryId: src.categoryId,
      images: src.images as Prisma.InputJsonValue,
      inventory: src.inventory,
      sku: src.sku ? `${src.sku}-COPY` : "",
      status: "draft",
      variantGroupLabel: src.variantGroupLabel,
      variants: src.variants.length
        ? {
            create: src.variants.map((v) => ({
              name: v.name,
              price: v.price,
              stock: v.stock,
            })),
          }
        : undefined,
    },
  });
  revalidatePath("/dashboard/products");
  return {};
}
