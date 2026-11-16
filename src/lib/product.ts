import type { Product, ProductVariant } from "@/lib/types";
import { hasFeature, type Plan } from "./plan";

/** The biggest sale a product can carry. */
export const MAX_SALE_PERCENT = 90;

/**
 * The percent off that applies to a product: the bigger of its own sale and
 * its collection's, and only when the store's plan includes sales.
 */
export function effectiveSale(
  plan: Plan,
  own?: number | null,
  collection?: number | null,
): number {
  if (!hasFeature(plan, "sales")) return 0;
  const pct = Math.max(own ?? 0, collection ?? 0);
  return Math.min(MAX_SALE_PERCENT, Math.max(0, Math.floor(pct)));
}

/** A price after a percent-off sale, rounded to cents. */
export function withSale(price: number, percent?: number | null): number {
  if (!percent || percent <= 0) return price;
  return Math.round(price * (100 - Math.min(percent, MAX_SALE_PERCENT))) / 100;
}

/** The price before any sale, for a product or one of its variants. */
export function listPrice(p: Product, variantId?: string): number {
  const v = variantId
    ? p.variantGroup?.variants.find((x) => x.id === variantId)
    : undefined;
  return v?.price ?? p.price;
}

/** The variant whose price is shown on shop cards (the first one if none is marked). */
export function defaultVariant(p: Product): ProductVariant | undefined {
  const vs = p.variantGroup?.variants;
  if (!vs?.length) return undefined;
  return vs.find((v) => v.isDefault) ?? vs[0];
}

/** The price shown on a shop card, with the product's sale applied. */
export function cardPrice(p: Product): number {
  return withSale(defaultVariant(p)?.price ?? p.price, p.sale);
}

/**
 * The crossed-out price to show beside a shop card price: the pre-sale price
 * while a sale runs, otherwise the owner's "compare-at" price if it's higher.
 */
export function cardWasPrice(p: Product): number | undefined {
  const base = defaultVariant(p)?.price ?? p.price;
  if (p.sale) return base;
  return p.compareAt && p.compareAt > base ? p.compareAt : undefined;
}

/** Units available for a product, or for one of its variants. */
export function stockFor(p: Product, variantId?: string): number {
  if (p.variantGroup) {
    const v = p.variantGroup.variants.find((x) => x.id === variantId);
    return v ? Math.max(0, v.stock) : 0;
  }
  return Math.max(0, p.inventory);
}

/** True when nothing can be bought at all. */
export function isSoldOut(p: Product): boolean {
  if (p.variantGroup) return p.variantGroup.variants.every((v) => v.stock <= 0);
  return p.inventory <= 0;
}

/**
 * Price per unit for a cart line, with the product's sale applied. Wholesale
 * (Arcade) kicks in once the line reaches the product's minimum quantity, and
 * only ever lowers the price.
 */
export function unitPrice(
  p: Product,
  variantId: string | undefined,
  quantity: number,
  wholesaleOn: boolean,
): number {
  const v = p.variantGroup?.variants.find((x) => x.id === variantId);
  const regular = withSale(v?.price ?? p.price, p.sale);
  if (
    wholesaleOn &&
    p.wholesalePrice &&
    p.wholesaleMinQty &&
    quantity >= p.wholesaleMinQty
  ) {
    return Math.min(regular, p.wholesalePrice);
  }
  return regular;
}

/** Digits-only phone, with Lebanese local numbers turned into 961… form. */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("961")) return d;
  if (d.length === 8 && d.startsWith("0")) return `961${d.slice(1)}`;
  if (d.length === 7 || d.length === 8) return `961${d.replace(/^0/, "")}`;
  return d;
}
