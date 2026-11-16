import type { Product, ProductVariant } from "@/lib/types";

/** The variant whose price is shown on shop cards (the first one if none is marked). */
export function defaultVariant(p: Product): ProductVariant | undefined {
  const vs = p.variantGroup?.variants;
  if (!vs?.length) return undefined;
  return vs.find((v) => v.isDefault) ?? vs[0];
}

/** The price shown on a shop card. */
export function cardPrice(p: Product): number {
  return defaultVariant(p)?.price ?? p.price;
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
 * Price per unit for a cart line. Wholesale (Arcade) kicks in once the line
 * reaches the product's minimum quantity, and only ever lowers the price.
 */
export function unitPrice(
  p: Product,
  variantId: string | undefined,
  quantity: number,
  wholesaleOn: boolean,
): number {
  const v = p.variantGroup?.variants.find((x) => x.id === variantId);
  const regular = v?.price ?? p.price;
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
