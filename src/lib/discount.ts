/** A discount code as checkout sees it. */
export interface DiscountRule {
  kind: string; // "percent" | "fixed"
  value: number;
  minTotal?: number | null;
  active: boolean;
}

export type DiscountCheck =
  | { ok: true; amount: number }
  | { ok: false; reason: string };

/** Round to cents. */
const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * How much a code takes off a subtotal. Never more than the subtotal, and
 * never applied below the code's minimum order total.
 */
export function applyDiscount(
  rule: DiscountRule,
  subtotal: number,
  formatMin: (n: number) => string = (n) => n.toFixed(2),
): DiscountCheck {
  if (!rule.active) return { ok: false, reason: "That code isn't active." };
  if (rule.minTotal && subtotal < rule.minTotal) {
    return {
      ok: false,
      reason: `That code works on orders of ${formatMin(rule.minTotal)} or more.`,
    };
  }
  const raw =
    rule.kind === "fixed"
      ? rule.value
      : (subtotal * Math.min(100, Math.max(0, rule.value))) / 100;
  return { ok: true, amount: cents(Math.min(subtotal, Math.max(0, raw))) };
}

/** Normalise what a shopper typed into the stored code form. */
export function cleanCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "-");
}
