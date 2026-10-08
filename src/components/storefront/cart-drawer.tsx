"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Minus, Plus, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import { placeOrder } from "@/app/s/[store]/actions";
import { themeStyle } from "@/lib/store-theme";
import { formatMoney } from "@/lib/utils";

export function CartDrawer() {
  const {
    store,
    lines,
    subtotal,
    open,
    setOpen,
    setQuantity,
    remove,
    clear,
    add,
  } = useCart();
  const router = useRouter();
  const [phase, setPhase] = React.useState<"cart" | "details">("cart");
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [error, setError] = React.useState("");
  const freeShipAt = 75;
  const remaining = freeShipAt - subtotal;

  function placeTheOrder() {
    setError("");
    setCheckingOut(true);
    const items = lines.map((l) => ({
      productId: l.product.id,
      variantId: l.variantId,
      quantity: l.quantity,
    }));
    React.startTransition(async () => {
      const res = await placeOrder(
        store.slug,
        items,
        { name, email },
        address,
      );
      setCheckingOut(false);
      if (res.error || !res.orderNumber) {
        setError(res.error ?? "Something went wrong — try again.");
        return;
      }
      const orderNumber = res.orderNumber;
      setOpen(false);
      setPhase("cart");
      setName("");
      setEmail("");
      setAddress("");
      clear();
      router.push(
        `/s/${store.slug}/order-confirmed?order=${encodeURIComponent(orderNumber)}`,
      );
    });
  }

  const sfInput =
    "h-11 w-full rounded-xl border border-sf-line bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-sf-muted/60 focus:border-sf-ink";

  // Cross-sell: active products not already in the bag, featured first.
  const inCart = new Set(lines.map((l) => l.product.id));
  const recommendations = store.products
    .filter((p) => p.status === "active" && p.inventory > 0 && !inCart.has(p.id))
    .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
    .slice(0, 3);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* portal renders outside the themed wrapper — re-apply the theme vars */}
      <SheetContent
        side="right"
        className="storefront bg-sf-bg text-sf-ink"
        style={themeStyle(store.theme)}
        hideClose
      >
        <div className="flex items-center justify-between border-b border-sf-line px-5 py-4">
          <SheetTitle className="sf-display text-lg">
            Your bag{" "}
            {lines.length > 0 && (
              <span className="text-sf-muted">
                ({lines.reduce((s, l) => s + l.quantity, 0)})
              </span>
            )}
          </SheetTitle>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="rounded-md p-1.5 transition-opacity hover:opacity-60"
          >
            <X className="size-5" />
          </button>
        </div>
        <SheetDescription className="sr-only">
          Items in your shopping bag
        </SheetDescription>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-sf-wash">
              <ShoppingBag className="size-6 text-sf-muted" />
            </span>
            <div>
              <p className="sf-display text-lg">Your bag is empty</p>
              <p className="mt-1 text-sm text-sf-muted">
                Everything you add shows up here.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-sf-brand px-6 py-3 text-sm font-semibold text-sf-on-brand transition-colors hover:bg-sf-brand-hover"
            >
              Keep browsing
            </button>
          </div>
        ) : (
          <>
            {remaining > 0 ? (
              <div className="border-b border-sf-line px-5 py-3">
                <p className="text-xs text-sf-muted">
                  {formatMoney(remaining, store.currency)} away from free
                  shipping
                </p>
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-sf-wash"
                  role="progressbar"
                  aria-label="Progress toward free shipping"
                  aria-valuenow={Math.round((subtotal / freeShipAt) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-sf-brand transition-all duration-500"
                    style={{
                      width: `${Math.min((subtotal / freeShipAt) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="border-b border-sf-line px-5 py-3 text-xs font-medium">
                You&apos;ve unlocked free shipping 🎉
              </p>
            )}

            <ul className="flex-1 divide-y divide-sf-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <Link
                    href={`/s/${store.slug}/product/${l.product.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sf-wash"
                  >
                    <Image
                      src={l.product.images[0]}
                      alt={l.product.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {l.product.title}
                        </p>
                        {l.variantName && (
                          <p className="text-xs text-sf-muted">
                            {l.variantName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(l.key)}
                        aria-label={`Remove ${l.product.title}`}
                        className="p-1 text-sf-muted transition-colors hover:text-sf-ink"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-sf-line">
                        <button
                          onClick={() => setQuantity(l.key, l.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-2 transition-opacity hover:opacity-60"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span
                          className="w-6 text-center text-sm tabular-nums"
                          aria-live="polite"
                        >
                          {l.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(l.key, l.quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-2 transition-opacity hover:opacity-60"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatMoney(l.unitPrice * l.quantity, store.currency)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {phase === "cart" && recommendations.length > 0 && (
              <div className="border-t border-sf-line px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-sf-muted">
                  Add to your order
                </p>
                <ul className="space-y-3">
                  {recommendations.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <Link
                        href={`/s/${store.slug}/product/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sf-wash"
                      >
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-sf-muted">
                          {formatMoney(p.price, store.currency)}
                        </p>
                      </div>
                      {p.variantGroup ? (
                        <Link
                          href={`/s/${store.slug}/product/${p.slug}`}
                          onClick={() => setOpen(false)}
                          aria-label={`Choose options for ${p.title}`}
                          className="flex size-8 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
                        >
                          <Plus className="size-4" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => add(p.id)}
                          aria-label={`Add ${p.title} to bag`}
                          className="flex size-8 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink active:scale-90"
                        >
                          <Plus className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-sf-line p-5">
              <div className="flex justify-between text-sm">
                <span className="text-sf-muted">Subtotal</span>
                <span className="font-semibold">
                  {formatMoney(subtotal, store.currency)}
                </span>
              </div>

              {phase === "cart" ? (
                <>
                  <p className="mt-1 text-xs text-sf-muted">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <button
                    onClick={() => setPhase("details")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99]"
                  >
                    <Lock className="size-3.5" />
                    Check out
                  </button>
                </>
              ) : (
                <div className="mt-4 space-y-2.5">
                  <input
                    className={sfInput}
                    placeholder="Full name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={sfInput}
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <textarea
                    className={`${sfInput} h-auto min-h-20 py-3 leading-relaxed`}
                    placeholder="Shipping address"
                    autoComplete="shipping street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {error && (
                    <p className="text-xs text-sf-brand" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={placeTheOrder}
                    disabled={checkingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99] disabled:opacity-70"
                  >
                    {checkingOut ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    {checkingOut
                      ? "Placing your order…"
                      : `Place order · ${formatMoney(subtotal, store.currency)}`}
                  </button>
                  <button
                    onClick={() => setPhase("cart")}
                    className="w-full text-center text-xs text-sf-muted underline-offset-4 hover:underline"
                  >
                    Back to bag
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
