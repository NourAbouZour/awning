// Plan rules. The free Stall plan is free forever and capped by product
// count; paid plans unlock features. Pure + unit-tested.

export const FREE_PRODUCT_LIMIT = 5;

export type Plan = "stall" | "shopfront" | "arcade";

export const PLAN_LABELS: Record<Plan, string> = {
  stall: "Stall",
  shopfront: "Shopfront",
  arcade: "Arcade",
};

/** Product cap for a plan. Stall is the free tier; paid plans are unlimited. */
export function productLimit(plan: Plan): number {
  return plan === "stall" ? FREE_PRODUCT_LIMIT : Infinity;
}

/** Features unlocked by each paid plan. Arcade includes everything in Shopfront. */
export type Feature =
  | "customDomain"
  | "discounts"
  | "emailMarketing"
  | "abandonedCart"
  | "upsell"
  | "multiStore"
  | "staff"
  | "analytics"
  | "wholesale"
  | "aiSeo"
  | "removeBranding"
  | "api";

const SHOPFRONT_FEATURES: Feature[] = [
  "customDomain",
  "discounts",
  "emailMarketing",
  "abandonedCart",
  "upsell",
];

const ARCADE_FEATURES: Feature[] = [
  ...SHOPFRONT_FEATURES,
  "multiStore",
  "staff",
  "analytics",
  "wholesale",
  "aiSeo",
  "removeBranding",
  "api",
];

/** The cheapest plan that includes a feature. */
export function planFor(feature: Feature): Plan {
  return SHOPFRONT_FEATURES.includes(feature) ? "shopfront" : "arcade";
}

/** Whether a plan includes a feature. */
export function hasFeature(plan: Plan, feature: Feature): boolean {
  if (plan === "arcade") return ARCADE_FEATURES.includes(feature);
  if (plan === "shopfront") return SHOPFRONT_FEATURES.includes(feature);
  return false;
}

/** True once the catalog has reached the plan's product limit. */
export function limitReached(count: number, plan: Plan): boolean {
  return count >= productLimit(plan);
}
