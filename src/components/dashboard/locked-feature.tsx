import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, planFor, type Feature } from "@/lib/plan";

/**
 * Shown in place of a paid page on a plan that doesn't include it. Points to
 * Settings, where the owner asks for the plan (approved by hand in /admin).
 */
export function LockedFeature({
  feature,
  title,
  description,
}: {
  feature: Feature;
  title: string;
  description: string;
}) {
  const plan = PLAN_LABELS[planFor(feature)];
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-wash">
        <Lock className="size-6 text-green" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-green">
        {plan} plan
      </p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
        {description}
      </p>
      <div className="mt-6 flex justify-center">
        <Button size="lg" asChild>
          <Link href="/dashboard/settings">Ask for the {plan} plan</Link>
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Pick {plan} in Settings. We confirm it and arrange payment by Whish or
        cash.
      </p>
    </Card>
  );
}
