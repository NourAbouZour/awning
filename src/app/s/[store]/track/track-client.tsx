"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Search, X } from "lucide-react";
import { trackOrder, type TrackedOrder } from "@/app/s/[store]/actions";
import { cn, formatDateTime, formatMoney } from "@/lib/utils";

type Result = { error?: string; order?: TrackedOrder } | null;

const STAGES: { key: TrackedOrder["status"]; title: string; body: string }[] = [
  {
    key: "pending",
    title: "Order received",
    body: "The store has your order and will confirm it with you.",
  },
  {
    key: "paid",
    title: "Confirmed",
    body: "Your order is confirmed and is being prepared.",
  },
  {
    key: "fulfilled",
    title: "Packed",
    body: "Your order is packed and ready to go out.",
  },
  {
    key: "shipped",
    title: "On its way",
    body: "Your order has left the store and is on its way to you.",
  },
];

export function TrackClient({
  storeSlug,
  storeName,
  currency,
  initialNumber,
  initial,
}: {
  storeSlug: string;
  storeName: string;
  currency: string;
  initialNumber: string;
  initial: Result;
}) {
  const [number, setNumber] = React.useState(initialNumber);
  const [result, setResult] = React.useState<Result>(initial);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setResult(await trackOrder(storeSlug, number));
    });
  }

  const order = result?.order;
  const cancelled = order?.status === "cancelled";
  const reached = order ? STAGES.findIndex((s) => s.key === order.status) : -1;

  return (
    <>
      <form onSubmit={submit} className="mt-8 flex gap-2.5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-sf-muted">
            #
          </span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d#\s]/g, ""))}
            inputMode="numeric"
            placeholder="1001"
            aria-label="Order number"
            className="h-13 w-full rounded-full border border-sf-line bg-transparent pl-8 pr-4 text-base outline-none transition-colors placeholder:text-sf-muted/60 focus:border-sf-ink"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !number.trim()}
          className="flex h-13 items-center gap-2 rounded-full bg-sf-brand px-6 text-sm font-semibold text-sf-on-brand transition-colors hover:bg-sf-brand-hover disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Track
        </button>
      </form>

      <div aria-live="polite">
        {result?.error && (
          <p className="mt-5 rounded-2xl border border-sf-line px-5 py-4 text-sm">
            {result.error}
          </p>
        )}

        {order && (
          <div className="mt-8 rounded-2xl border border-sf-line p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="sf-display text-2xl">Order {order.number}</p>
              <p className="text-sm text-sf-muted">
                Placed {formatDateTime(order.placedAt)}
              </p>
            </div>
            <p className="mt-1 text-sm text-sf-muted">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
              {formatMoney(order.total, currency)} ·{" "}
              {order.paymentMethod === "whish" ? "Whish" : "Cash on delivery"}
            </p>

            {cancelled ? (
              <p className="mt-6 flex items-start gap-3 rounded-xl bg-sf-wash p-4 text-sm">
                <X className="mt-0.5 size-4 shrink-0" />
                <span>
                  This order was cancelled. If you think that&apos;s a mistake,{" "}
                  <Link
                    href={`/s/${storeSlug}/contact`}
                    className="underline underline-offset-4"
                  >
                    contact {storeName}
                  </Link>
                  .
                </span>
              </p>
            ) : (
              <ol className="mt-7">
                {STAGES.map((s, i) => {
                  const done = i <= reached;
                  const current = i === reached;
                  return (
                    <li key={s.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            done
                              ? "border-sf-brand bg-sf-brand text-sf-on-brand"
                              : "border-sf-line text-sf-muted",
                          )}
                        >
                          {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        {i < STAGES.length - 1 && (
                          <span
                            className={cn(
                              "my-1 w-px flex-1",
                              i < reached ? "bg-sf-brand" : "bg-sf-line",
                            )}
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className={cn("pb-6", !done && "opacity-55")}>
                        <p className="text-sm font-semibold">
                          {s.title}
                          {current && (
                            <span className="ml-2 rounded-full bg-sf-wash px-2 py-0.5 text-[11px] font-medium">
                              Now
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-sf-muted">
                          {s.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    </>
  );
}
