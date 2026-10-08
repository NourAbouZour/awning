import Link from "next/link";
import { AwningLogo } from "@/components/awning-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
      <AwningLogo />
      {/* closed-shop illustration: awning rolled up */}
      <div className="mt-10 w-40" aria-hidden>
        <div className="awning-stripes h-6 rounded-t-lg opacity-90" />
        <div className="scallop awning-stripes" />
        <div className="mx-auto mt-4 flex h-20 w-28 items-center justify-center rounded-lg border border-line-strong bg-paper text-xs font-medium text-ink-soft">
          Sorry, we&apos;re closed
        </div>
      </div>
      <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-ink">
        This page isn&apos;t here
      </h1>
      <p className="mt-3 max-w-sm text-ink-soft">
        The address may have changed, or the shop that lived here has moved on.
        Nothing is lost — your bag and account are safe.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">Back to Awning</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
