// Free-plan rules. No billing backend yet, so the trial is informational and
// the product limit is the real constraint. Pure + unit-tested.

export const FREE_PRODUCT_LIMIT = 5;
export const TRIAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

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

/** True once the catalog has reached the plan's product limit. */
export function limitReached(count: number, plan: Plan): boolean {
  return count >= productLimit(plan);
}

export interface TrialStatus {
  /** Whole days remaining in the trial (0 once it has ended). */
  daysLeft: number;
  /** Whether the trial window is still open. */
  active: boolean;
  /** When the free month ends. */
  endsAt: Date;
}

/** The trial state for a store/account created at `createdAt`. */
export function trialStatus(createdAt: Date, now: Date = new Date()): TrialStatus {
  const endsAt = new Date(createdAt.getTime() + TRIAL_DAYS * DAY_MS);
  const remainingMs = endsAt.getTime() - now.getTime();
  const active = remainingMs > 0;
  const daysLeft = active ? Math.ceil(remainingMs / DAY_MS) : 0;
  return { daysLeft, active, endsAt };
}
