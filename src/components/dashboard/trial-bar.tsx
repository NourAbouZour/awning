import Link from "next/link";
import { PartyPopper, Clock, BadgeCheck, CreditCard } from "lucide-react";
import { FREE_PRODUCT_LIMIT, PLAN_LABELS, type Plan } from "@/lib/plan";

/**
 * Slim informational bar across the dashboard. Stall accounts see the
 * free-trial countdown; paid plans see their plan + payment status. No real
 * billing — the owner confirms payment from the admin panel.
 */
export function TrialBar({
  daysLeft,
  active,
  plan,
  billingPaid,
}: {
  daysLeft: number;
  active: boolean;
  plan: Plan;
  billingPaid: boolean;
}) {
  if (plan !== "stall") {
    if (billingPaid) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-green-wash px-4 py-2 text-center text-[13px] text-green">
          <BadgeCheck className="size-3.5" aria-hidden />
          <span className="font-medium">
            {PLAN_LABELS[plan]} plan — active
          </span>
          <span className="text-green/70">· unlimited products</span>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-warn-wash px-4 py-2 text-center text-[13px] text-warn">
        <CreditCard className="size-3.5" aria-hidden />
        <span className="font-medium">
          {PLAN_LABELS[plan]} plan — payment pending
        </span>
        <span className="text-warn/80">
          We&apos;ll be in touch to arrange it. Your store stays live
          meanwhile.
        </span>
      </div>
    );
  }

  if (active) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-green-wash px-4 py-2 text-center text-[13px] text-green">
        <PartyPopper className="size-3.5" aria-hidden />
        <span className="font-medium">
          Free trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </span>
        <span className="text-green/70">
          · Free plan includes up to {FREE_PRODUCT_LIMIT} products
        </span>
        <Link
          href="/pricing"
          className="font-semibold underline underline-offset-4 hover:opacity-80"
        >
          See plans
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-warn-wash px-4 py-2 text-center text-[13px] text-warn">
      <Clock className="size-3.5" aria-hidden />
      <span className="font-medium">Your free month has ended.</span>
      <span className="text-warn/80">
        You can still manage your store (up to {FREE_PRODUCT_LIMIT} products).
      </span>
      <Link
        href="/pricing"
        className="rounded-full bg-warn px-3 py-0.5 text-[12px] font-semibold text-white hover:opacity-90"
      >
        Upgrade
      </Link>
    </div>
  );
}
