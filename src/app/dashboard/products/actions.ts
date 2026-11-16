"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCurrentStore, getCurrentPlan } from "@/lib/auth";
import { hasFeature, limitReached, FREE_PRODUCT_LIMIT } from "@/lib/plan";

const LIMIT_MESSAGE = `You've reached ${FREE_PRODUCT_LIMIT} products on the free plan, upgrade to add more.`;

export interface VariantInput {
  name: string;
  price?: number | null;
  stock: number;
  /** This variant's price is the one shown on shop cards. */
  isDefault?: boolean;
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
  /** Empty string = no collection (the product then stays off the storefront). */
  categoryId: string;
  status: "active" | "draft";
  images: string[];
  variantLabel?: string | null;
  variants: VariantInput[];
  // Arcade only; ignored on other plans.
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
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
  if (
    input.wholesalePrice != null &&
    (!(input.wholesalePrice > 0) ||
      !(input.wholesaleMinQty && input.wholesaleMinQty >= 2))
  )
    return "Wholesale needs a price and a minimum quantity of 2 or more.";
  return null;
}

/** Keep only persistable image URLs (drop ephemeral blob: previews). */
function cleanImages(images: string[]): string[] {
  const kept = images.filter((u) => !u.startsWith("blob:"));
  return kept.length ? kept : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1400&auto=format&fit=crop"];
}

function cleanVariants(input: ProductInput) {
  if (!input.variantLabel || input.variants.length === 0) {
    return { variantGroupLabel: null, variants: [] as Required<VariantInput>[] };
  }
  const variants = input.variants
    .filter((v) => v.name.trim())
    .map((v) => ({
      name: v.name.trim(),
      price: v.price != null && v.price > 0 ? v.price : null,
      stock: Number.isFinite(v.stock) ? Math.max(0, Math.floor(v.stock)) : 0,
      isDefault: !!v.isDefault,
    }));
  // Exactly one variant drives the card price; default to the first.
  let seen = false;
  for (const v of variants) {
    if (v.isDefault && seen) v.isDefault = false;
    if (v.isDefault) seen = true;
  }
  if (variants.length && !seen) variants[0].isDefault = true;
  return { variantGroupLabel: input.variantLabel.trim(), variants };
}

function variantCreate(variants: Required<VariantInput>[]) {
  return variants.length
    ? {
        create: variants.map((v) => ({
          name: v.name,
          price: v.price != null ? new Prisma.Decimal(v.price) : null,
          stock: v.stock,
          isDefault: v.isDefault,
        })),
      }
    : undefined;
}

async function assertCategory(storeId: string, categoryId: string) {
  if (!categoryId) return;
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });
  if (!cat) throw new Error("Collection does not belong to this store.");
}

/** Wholesale and SEO fields, saved only on a plan that includes them. */
async function arcadeFields(input: ProductInput) {
  const plan = await getCurrentPlan();
  const wholesale = hasFeature(plan, "wholesale");
  const seo = hasFeature(plan, "aiSeo");
  const hasWholesale = input.wholesalePrice != null && input.wholesalePrice > 0;
  return {
    ...(wholesale
      ? {
          wholesalePrice: hasWholesale
            ? new Prisma.Decimal(input.wholesalePrice as number)
            : null,
          wholesaleMinQty:
            hasWholesale && input.wholesaleMinQty
              ? Math.max(2, Math.floor(input.wholesaleMinQty))
              : null,
        }
      : {}),
    ...(seo
      ? {
          seoTitle: input.seoTitle?.trim().slice(0, 70) || null,
          seoDescription: input.seoDescription?.trim().slice(0, 160) || null,
        }
      : {}),
  };
}

export async function createProduct(
  input: ProductInput,
): Promise<ProductActionState> {
  const store = await requireCurrentStore();
  const err = validate(input);
  if (err) return { error: err };

  const count = await prisma.product.count({ where: { storeId: store.id } });
  if (limitReached(count, await getCurrentPlan())) return { error: LIMIT_MESSAGE };

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
      categoryId: input.categoryId || null,
      images: cleanImages(input.images) as unknown as Prisma.InputJsonValue,
      inventory: variants.length
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : Math.max(0, input.inventory | 0),
      sku: input.sku ?? "",
      status: input.status,
      ...(await arcadeFields(input)),
      variantGroupLabel,
      variants: variantCreate(variants),
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
  const extra = await arcadeFields(input);

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
        categoryId: input.categoryId || null,
        images: cleanImages(input.images) as unknown as Prisma.InputJsonValue,
        inventory: variants.length
          ? variants.reduce((sum, v) => sum + v.stock, 0)
          : Math.max(0, input.inventory | 0),
        sku: input.sku ?? "",
        status: input.status,
        ...extra,
        variantGroupLabel,
        variants: variantCreate(variants),
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
  if (limitReached(count, await getCurrentPlan())) return { error: LIMIT_MESSAGE };

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
      seoTitle: src.seoTitle,
      seoDescription: src.seoDescription,
      wholesalePrice: src.wholesalePrice,
      wholesaleMinQty: src.wholesaleMinQty,
      variantGroupLabel: src.variantGroupLabel,
      variants: src.variants.length
        ? {
            create: src.variants.map((v) => ({
              name: v.name,
              price: v.price,
              stock: v.stock,
              isDefault: v.isDefault,
            })),
          }
        : undefined,
    },
  });
  revalidatePath("/dashboard/products");
  return {};
}
