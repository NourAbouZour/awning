import Link from "next/link";
import { BadgeCheck, Clock, Store } from "lucide-react";
import { FREE_PRODUCT_LIMIT, PLAN_LABELS, type Plan } from "@/lib/plan";

/**
 * Slim plan bar across the dashboard. The free Stall plan is free forever
 * (capped at FREE_PRODUCT_LIMIT products). Paid plans are approved by the
 * platform owner, so a pending request shows here until then.
 */
export function TrialBar({
  plan,
  requestedPlan,
}: {
  plan: Plan;
  requestedPlan: Plan | null;
}) {
  if (requestedPlan) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-warn-wash px-4 py-2 text-center text-[13px] text-warn">
        <Clock className="size-3.5" aria-hidden />
        <span className="font-medium">
          {PLAN_LABELS[requestedPlan]} plan requested
        </span>
        <span className="text-warn/80">
          · We&apos;ll contact you to arrange payment by Whish or cash, then
          switch it on.
        </span>
      </div>
    );
  }

  if (plan !== "stall") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-green-wash px-4 py-2 text-center text-[13px] text-green">
        <BadgeCheck className="size-3.5" aria-hidden />
        <span className="font-medium">{PLAN_LABELS[plan]} plan, active</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-green-wash px-4 py-2 text-center text-[13px] text-green">
      <Store className="size-3.5" aria-hidden />
      <span className="font-medium">Free plan</span>
      <span className="text-green/70">
        · up to {FREE_PRODUCT_LIMIT} products, free forever
      </span>
      <Link
        href="/dashboard/settings"
        className="font-semibold underline underline-offset-4 hover:opacity-80"
      >
        See plans
      </Link>
    </div>
  );
}
