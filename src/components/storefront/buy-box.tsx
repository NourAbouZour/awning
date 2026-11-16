"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCart } from "@/components/storefront/cart-context";
import type { Product } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";
import { hasFeature } from "@/lib/plan";
import { defaultVariant, isSoldOut, withSale } from "@/lib/product";

export function BuyBox({ product }: { product: Product }) {
  const { store, add, remaining } = useCart();
  const variants = product.variantGroup?.variants;
  // Start on the variant whose price the shop card showed, if it's in stock.
  const [variantId, setVariantId] = React.useState<string | undefined>(() => {
    const d = defaultVariant(product);
    return d && d.stock > 0 ? d.id : undefined;
  });
  const [quantity, setQuantity] = React.useState(1);
  const [needsVariant, setNeedsVariant] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  const selected = variants?.find((v) => v.id === variantId);
  const basePrice = selected?.price ?? product.price;
  const price = withSale(basePrice, product.sale);
  // Crossed-out price: the pre-sale price during a sale, else "compare-at".
  const was = product.sale
    ? basePrice
    : product.compareAt && product.compareAt > price
      ? product.compareAt
      : undefined;
  const soldOut = isSoldOut(product);
  // Units still available for what's selected, after what's already in the bag.
  const left =
    variants && !variantId ? Infinity : remaining(product.id, variantId);
  const maxQty = Number.isFinite(left) ? left : 99;
  const wholesale =
    hasFeature(store.plan, "wholesale") &&
    product.wholesalePrice &&
    product.wholesaleMinQty
      ? { price: product.wholesalePrice, min: product.wholesaleMinQty }
      : null;

  // Keep the chosen amount inside what's in stock for the selection.
  const qty = Math.max(1, Math.min(quantity, Math.max(1, maxQty)));

  function addToBag() {
    setNotice("");
    if (variants && !variantId) {
      setNeedsVariant(true);
      return;
    }
    if (maxQty <= 0) {
      setNotice("You already have all the stock we have in your bag.");
      return;
    }
    const added = add(product.id, variantId, qty);
    if (added < qty) {
      setNotice(`Only ${added} more could be added, that's all we have.`);
    }
    setQuantity(1);
  }

  return (
    <div>
      <h1 className="sf-display text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
        {product.title}
      </h1>
      <p className="mt-3 text-xl">
        {was !== undefined && (
          <span className="mr-2.5 text-sf-muted line-through">
            {formatMoney(was, store.currency)}
          </span>
        )}
        <span
          className={cn("font-semibold", was !== undefined && "text-sf-brand")}
        >
          {formatMoney(price, store.currency)}
        </span>
        {product.sale ? (
          <span className="ml-3 rounded-full bg-sf-brand px-2.5 py-1 align-middle text-xs font-semibold text-sf-on-brand">
            {product.sale}% off
          </span>
        ) : null}
      </p>

      {/* variants */}
      {variants && (
        <fieldset className="mt-7">
          <legend className="text-sm font-semibold">
            {product.variantGroup!.label}
            {needsVariant && (
              <span className="ml-2 font-normal text-sf-brand" role="alert">
                (pick one first)
              </span>
            )}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const out = v.stock === 0;
              const on = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  aria-pressed={on}
                  onClick={() => {
                    setVariantId(v.id);
                    setNeedsVariant(false);
                  }}
                  className={cn(
                    "min-w-14 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                    on
                      ? "border-sf-ink bg-sf-ink text-sf-bg"
                      : "border-sf-line hover:border-sf-ink",
                    out &&
                      "cursor-not-allowed text-sf-muted line-through opacity-50 hover:border-sf-line"
                  )}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
          {selected && selected.stock > 0 && selected.stock <= 5 && (
            <p className="mt-2.5 text-xs font-medium text-sf-brand">
              Only {selected.stock} left in {selected.name}
            </p>
          )}
        </fieldset>
      )}

      {/* quantity + add */}
      <div className="mt-7 flex gap-3">
        <div className="flex items-center rounded-full border border-sf-line">
          <button
            onClick={() => setQuantity(Math.max(1, qty - 1))}
            aria-label="Decrease quantity"
            className="p-3.5 transition-opacity hover:opacity-60"
          >
            <Minus className="size-4" />
          </button>
          <span
            className="w-8 text-center text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            onClick={() => setQuantity(Math.min(qty + 1, maxQty))}
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
            className="p-3.5 transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          onClick={addToBag}
          disabled={soldOut}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-sf-brand px-8 py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="size-4" />
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
      </div>
      {!variants && !soldOut && product.inventory <= 5 && (
        <p className="mt-2.5 text-xs font-medium text-sf-brand">
          Only {product.inventory} left
        </p>
      )}
      {notice && (
        <p className="mt-2.5 text-xs font-medium text-sf-brand" role="status">
          {notice}
        </p>
      )}
      {wholesale && (
        <p className="mt-3 rounded-xl bg-sf-wash px-4 py-3 text-sm">
          Buying in bulk? Pay{" "}
          <span className="font-semibold">
            {formatMoney(wholesale.price, store.currency)}
          </span>{" "}
          each when you take {wholesale.min} or more.
        </p>
      )}

      {/* accordions */}
      <Accordion
        type="multiple"
        defaultValue={["description"]}
        className="mt-9"
      >
        <AccordionItem value="description" className="border-sf-line">
          <AccordionTrigger>Description</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-sf-muted">
            {product.description}
          </AccordionContent>
        </AccordionItem>
        {store.shippingNote.trim() && (
          <AccordionItem value="shipping" className="border-sf-line">
            <AccordionTrigger>Shipping & returns</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-sf-muted">
              {store.shippingNote}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* sticky mobile add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sf-line bg-sf-bg/95 p-3.5 backdrop-blur-md md:hidden">
        <button
          onClick={addToBag}
          disabled={soldOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <ShoppingBag className="size-4" />
          {soldOut
            ? "Sold out"
            : `Add to bag · ${formatMoney(price * qty, store.currency)}`}
        </button>
      </div>
      {/* spacer so the sticky bar never covers content */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
