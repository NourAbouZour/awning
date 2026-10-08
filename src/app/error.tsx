"use client";

import { AwningLogo } from "@/components/awning-logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
      <AwningLogo />
      <h1 className="mt-10 font-display text-4xl font-bold tracking-tight text-ink">
        Something went wrong on our side
      </h1>
      <p className="mt-3 max-w-sm text-ink-soft">
        Not you — us. The error has been noted. Trying again usually fixes it.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
