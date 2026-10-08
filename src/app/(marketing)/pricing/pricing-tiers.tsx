"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Stall",
    blurb: "First month free. For your first products and your first sales.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "First month free",
      "Full storefront & checkout",
      "Up to 5 products",
      "yourshop.awning.shop address",
      "Orders, customers & messages",
    ],
  },
  {
    name: "Shopfront",
    blurb: "For a growing shop that's found its customers.",
    monthly: 19,
    yearly: 15,
    cta: "Start with Shopfront",
    highlighted: true,
    features: [
      "Everything in Stall",
      "Unlimited products",
      "Custom domain",
      "Discount codes",
      "Email marketing & abandoned cart",
      "Upsell & cross-sell",
      "Priority email support",
    ],
  },
  {
    name: "Arcade",
    blurb: "For established brands that want the full toolkit.",
    monthly: 49,
    yearly: 39,
    cta: "Start with Arcade",
    features: [
      "Everything in Shopfront",
      "Multiple storefronts",
      "Unlimited staff accounts",
      "Advanced analytics & reports",
      "Wholesale / B2B pricing",
      "AI product descriptions & SEO",
      "Remove Awning branding",
      "24/7 priority support & dedicated manager",
      "API & webhooks access",
    ],
  },
];

export function PricingTiers() {
  const [yearly, setYearly] = React.useState(true);

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-line-strong bg-paper p-1"
        >
          {(["Monthly", "Yearly"] as const).map((label) => {
            const active = (label === "Yearly") === yearly;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setYearly(label === "Yearly")}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-green text-white" : "text-ink-soft hover:text-ink"
                )}
              >
                {label}
                {label === "Yearly" && (
                  <span
                    className={cn(
                      "ml-1.5 text-xs",
                      active ? "text-white/75" : "text-green"
                    )}
                  >
                    −20%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-paper p-8",
              t.highlighted
                ? "border-green shadow-[0_24px_48px_-24px_rgb(17_75_50/0.35)]"
                : "border-line"
            )}
          >
            {t.highlighted && (
              <span className="absolute -top-3.5 left-8 rounded-full bg-green px-3 py-1 text-xs font-semibold text-white">
                Most shops pick this
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-ink">{t.name}</h3>
            <p className="mt-1.5 min-h-10 text-sm text-ink-soft">{t.blurb}</p>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-bold tracking-tight text-ink">
                ${yearly ? t.yearly : t.monthly}
              </span>
              <span className="text-sm text-ink-soft">/month</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {t.monthly === 0
                ? "No monthly fee"
                : yearly
                  ? "billed yearly"
                  : "billed monthly"}
            </p>
            <Button
              className="mt-7"
              size="lg"
              variant={t.highlighted ? "primary" : "outline"}
              asChild
            >
              <Link href="/signup">{t.cta}</Link>
            </Button>
            <ul className="mt-7 space-y-3 border-t border-line pt-6">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-body">
                  <Check className="mt-0.5 size-4 shrink-0 text-green" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
