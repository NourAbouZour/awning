"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import {
  checkDiscount,
  placeOrder,
  saveCheckoutDraft,
} from "@/app/s/[store]/actions";
import { hasFeature } from "@/lib/plan";
import { cardPrice, isSoldOut } from "@/lib/product";
import { themeStyle } from "@/lib/store-theme";
import { cn, formatMoney } from "@/lib/utils";

type Payment = "cash" | "whish";
type LocationState =
  | { kind: "idle" }
  | { kind: "finding" }
  | { kind: "found"; url: string }
  | { kind: "error"; message: string };

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
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [payment, setPayment] = React.useState<Payment>("cash");
  const [location, setLocation] = React.useState<LocationState>({ kind: "idle" });
  const [codeInput, setCodeInput] = React.useState("");
  const [discount, setDiscount] = React.useState<{ code: string; amount: number } | null>(null);
  const [codeError, setCodeError] = React.useState("");
  const [checkingCode, setCheckingCode] = React.useState(false);
  const [error, setError] = React.useState("");
  const draftId = React.useRef<string | null>(null);

  const takesCodes = hasFeature(store.plan, "discounts");
  const tracksCarts = hasFeature(store.plan, "abandonedCart");
  const showsUpsell = hasFeature(store.plan, "upsell");
  const freeShipAt = store.freeShipping && store.freeShipping > 0 ? store.freeShipping : null;
  const remainingForFree = freeShipAt ? freeShipAt - subtotal : 0;

  // A code was checked against an older subtotal: drop it so it's re-checked.
  const discountAmount = discount ? Math.min(discount.amount, subtotal) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const items = () =>
    lines.map((l) => ({
      productId: l.product.id,
      variantId: l.variantId,
      quantity: l.quantity,
    }));

  function saveDraft() {
    if (!tracksCarts || lines.length === 0) return;
    if (phone.replace(/\D/g, "").length < 7 && !email.includes("@")) return;
    const draft = { name, phone, email, items: items() };
    void saveCheckoutDraft(store.slug, draftId.current, draft).then((r) => {
      if (r.id) draftId.current = r.id;
    });
  }

  function getLocation() {
    if (!("geolocation" in navigator)) {
      setLocation({ kind: "error", message: "Your browser can't share a location." });
      return;
    }
    setLocation({ kind: "finding" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          kind: "found",
          url: `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        });
      },
      (err) =>
        setLocation({
          kind: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location is blocked. Allow it in your browser, or just type your address."
              : "Couldn't find your location. Type your address instead.",
        }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function applyCode() {
    setCodeError("");
    setCheckingCode(true);
    React.startTransition(async () => {
      const res = await checkDiscount(store.slug, codeInput, subtotal);
      setCheckingCode(false);
      if (res.error || !res.code) {
        setDiscount(null);
        setCodeError(res.error ?? "That code doesn't work.");
        return;
      }
      setDiscount({ code: res.code, amount: res.amount ?? 0 });
    });
  }

  function placeTheOrder() {
    setError("");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (phone.replace(/\D/g, "").length < 7)
      return setError("Enter your phone number so the store can reach you.");
    if (address.trim().length < 6) return setError("Enter a delivery address.");
    setCheckingOut(true);
    React.startTransition(async () => {
      const res = await placeOrder(
        store.slug,
        items(),
        { name, phone, email },
        address,
        {
          paymentMethod: payment,
          discountCode: discount?.code,
          locationUrl: location.kind === "found" ? location.url : undefined,
          cartId: draftId.current ?? undefined,
        },
      );
      setCheckingOut(false);
      if (res.error || !res.orderNumber) {
        setError(res.error ?? "Something went wrong, try again.");
        return;
      }
      const orderNumber = res.orderNumber;
      setOpen(false);
      setPhase("cart");
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setDiscount(null);
      setCodeInput("");
      setLocation({ kind: "idle" });
      draftId.current = null;
      clear();
      router.push(
        `/s/${store.slug}/order-confirmed?order=${encodeURIComponent(orderNumber)}&pay=${payment}`,
      );
    });
  }

  const sfInput =
    "h-11 w-full rounded-xl border border-sf-line bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-sf-muted/60 focus:border-sf-ink";

  // Upsell and cross-sell (Shopfront and up): first the products the owner
  // linked to what's in the bag, then featured ones, all in stock.
  const inCart = new Set(lines.map((l) => l.product.id));
  const linked = new Set(lines.flatMap((l) => l.product.relatedIds ?? []));
  const recommendations = showsUpsell
    ? store.products
        .filter((p) => p.status === "active" && !isSoldOut(p) && !inCart.has(p.id))
        .sort(
          (a, b) =>
            Number(linked.has(b.id)) - Number(linked.has(a.id)) ||
            Number(b.featured ?? false) - Number(a.featured ?? false),
        )
        .slice(0, 3)
    : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* portal renders outside the themed wrapper, re-apply the theme vars */}
      <SheetContent
        side="right"
        className="storefront bg-sf-bg text-sf-ink"
        style={themeStyle(store.theme)}
        hideClose
      >
        <div className="flex items-center justify-between border-b border-sf-line px-5 py-4">
          <SheetTitle className="sf-display text-lg">
            {phase === "details" ? "Checkout" : "Your bag"}{" "}
            {lines.length > 0 && phase === "cart" && (
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
        ) : phase === "cart" ? (
          <>
            {freeShipAt &&
              (remainingForFree > 0 ? (
                <div className="border-b border-sf-line px-5 py-3">
                  <p className="text-xs text-sf-muted">
                    {formatMoney(remainingForFree, store.currency)} away from
                    free shipping
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
                  You&apos;ve unlocked free shipping
                </p>
              ))}

            <ul className="flex-1 divide-y divide-sf-line overflow-y-auto px-5">
              {lines.map((l) => {
                const atMax = l.quantity >= l.stock;
                const wholesale = l.unitPrice < l.regularPrice;
                return (
                  <li key={l.key} className="flex gap-4 py-4">
                    <Link
                      href={`/s/${store.slug}/product/${l.product.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sf-wash"
                    >
                      {l.product.images[0] && (
                        <Image
                          src={l.product.images[0]}
                          alt={l.product.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
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
                          {wholesale && (
                            <p className="text-xs font-medium text-sf-brand">
                              Bulk price applied
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
                            disabled={atMax}
                            aria-label="Increase quantity"
                            className="p-2 transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatMoney(l.unitPrice * l.quantity, store.currency)}
                        </p>
                      </div>
                      {atMax && (
                        <p className="mt-1 text-[11px] text-sf-muted">
                          That&apos;s all we have in stock.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {recommendations.length > 0 && (
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
                          {formatMoney(cardPrice(p), store.currency)}
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
              <p className="mt-1 text-xs text-sf-muted">
                Pay cash on delivery or by Whish.
              </p>
              <button
                onClick={() => setPhase("details")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99]"
              >
                <Lock className="size-3.5" />
                Check out
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-2.5 p-5">
              <label className="block space-y-1">
                <span className="text-xs font-medium">Full name</span>
                <input
                  className={sfInput}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveDraft}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Phone number</span>
                <input
                  className={sfInput}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. 71 123 456"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={saveDraft}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">
                  Email <span className="font-normal text-sf-muted">(optional)</span>
                </span>
                <input
                  className={sfInput}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={saveDraft}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium">Delivery address</span>
                <textarea
                  className={`${sfInput} h-auto min-h-20 py-3 leading-relaxed`}
                  placeholder="Area, street, building, floor"
                  autoComplete="shipping street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>

              <div>
                {location.kind === "found" ? (
                  <p className="flex items-center justify-between gap-2 rounded-xl bg-sf-wash px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <Check className="size-4" />
                      Location added
                    </span>
                    <a
                      href={location.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline underline-offset-4"
                    >
                      Check on map
                    </a>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={location.kind === "finding"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-sf-line py-3 text-sm font-medium transition-colors hover:border-sf-ink disabled:opacity-60"
                  >
                    {location.kind === "finding" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    {location.kind === "finding" ? "Finding you…" : "Get my location"}
                  </button>
                )}
                {location.kind === "error" && (
                  <p className="mt-1.5 text-xs text-sf-muted">{location.message}</p>
                )}
              </div>

              <fieldset className="space-y-2 pt-1">
                <legend className="mb-2 text-xs font-medium">How will you pay?</legend>
                {(
                  [
                    { id: "cash", label: "Cash on delivery", icon: Banknote },
                    { id: "whish", label: "Whish", icon: Smartphone },
                  ] as const
                ).map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                      payment === m.id ? "border-sf-ink" : "border-sf-line",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={payment === m.id}
                      onChange={() => setPayment(m.id)}
                      className="sr-only"
                    />
                    <m.icon className="size-4" />
                    <span className="flex-1">{m.label}</span>
                    {payment === m.id && <Check className="size-4" />}
                  </label>
                ))}
                {payment === "whish" && (
                  <p className="text-xs text-sf-muted">
                    The store sends you their Whish details after you order.
                  </p>
                )}
              </fieldset>

              {takesCodes && (
                <div className="pt-1">
                  {discount ? (
                    <p className="flex items-center justify-between rounded-xl bg-sf-wash px-4 py-3 text-sm">
                      <span>
                        Code <b>{discount.code}</b> applied
                      </span>
                      <button
                        type="button"
                        onClick={() => setDiscount(null)}
                        className="text-xs underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        className={sfInput}
                        placeholder="Discount code"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        aria-label="Discount code"
                      />
                      <button
                        type="button"
                        onClick={applyCode}
                        disabled={!codeInput.trim() || checkingCode}
                        className="shrink-0 rounded-xl border border-sf-line px-4 text-sm font-medium transition-colors hover:border-sf-ink disabled:opacity-50"
                      >
                        {checkingCode ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  )}
                  {codeError && (
                    <p className="mt-1.5 text-xs text-sf-brand" role="alert">
                      {codeError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-sf-line p-5">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-sf-muted">Subtotal</span>
                  <span>{formatMoney(subtotal, store.currency)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between">
                    <span className="text-sf-muted">Discount</span>
                    <span>−{formatMoney(discountAmount, store.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(total, store.currency)}</span>
                </div>
              </div>
              {error && (
                <p className="mt-3 text-xs text-sf-brand" role="alert">
                  {error}
                </p>
              )}
              <button
                onClick={placeTheOrder}
                disabled={checkingOut}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99] disabled:opacity-70"
              >
                {checkingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-3.5" />
                )}
                {checkingOut
                  ? "Placing your order…"
                  : `Place order · ${formatMoney(total, store.currency)}`}
              </button>
              <button
                onClick={() => {
                  // The bag may change, so a code is checked again next time.
                  setDiscount(null);
                  setPhase("cart");
                }}
                className="mt-2 w-full text-center text-xs text-sf-muted underline-offset-4 hover:underline"
              >
                Back to bag
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
