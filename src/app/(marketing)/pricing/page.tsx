import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingTiers } from "./pricing-tiers";
import { PricingContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Awning is free while you build your store. One simple monthly subscription when you're ready — no per-sale fees, ever.",
};

export default function PricingPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-6xl">
              Priced like a market stall, not a mall lease.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-body">
              Build free. Publish free. One simple monthly subscription when
              you&apos;re ready — no per-sale fees, no surprises.
            </p>
          </div>
          <div className="mt-14">
            <PricingTiers />
          </div>
          <p className="mt-8 text-center text-sm text-ink-soft">
            All prices in USD. Flat monthly subscription — no per-sale fees.
            Cancel anytime — your store stays exportable.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-16 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 text-center md:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Not sure? Start on Stall — upgrading takes one click.
          </h2>
          <Button size="xl" asChild>
            <Link href="/signup">
              Start your store free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.3fr] md:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Talk to us
            </h2>
            <p className="mt-4 text-ink-body">
              Questions about plans, billing, or anything else? Send a note and
              a real person will get back to you.
            </p>
          </div>
          <PricingContactForm />
        </div>
      </section>
    </>
  );
}
