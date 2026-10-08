"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { subscribe } from "@/app/s/[store]/actions";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact }: { compact?: boolean }) {
  const { store } = useCart();
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "error" | "done">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }
    React.startTransition(async () => {
      const res = await subscribe(store.slug, email);
      setState(res.error ? "error" : "done");
    });
  }

  if (state === "done") {
    return (
      <p
        className={cn(
          "flex items-center gap-2 text-sm",
          compact ? "text-current/80" : "justify-center"
        )}
        role="status"
      >
        <Check className="size-4" />
        You&apos;re on the list — welcome.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn("w-full", compact ? "max-w-sm" : "mx-auto max-w-md")}
    >
      <div className="flex gap-2.5">
        <label htmlFor={compact ? "nl-footer" : "nl-main"} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? "nl-footer" : "nl-main"}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder="your@email.com"
          aria-invalid={state === "error"}
          className="h-12 min-w-0 flex-1 rounded-full border border-current/25 bg-transparent px-5 text-sm outline-none transition-colors placeholder:text-current/50 focus:border-current"
        />
        <button className="h-12 shrink-0 rounded-full bg-sf-brand px-6 text-sm font-semibold text-sf-on-brand transition-colors hover:bg-sf-brand-hover">
          Sign up
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-xs text-current/70" role="alert">
          That doesn&apos;t look like an email address — check for typos.
        </p>
      )}
    </form>
  );
}
