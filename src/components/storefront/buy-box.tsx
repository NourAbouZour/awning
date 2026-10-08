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

export function BuyBox({ product }: { product: Product }) {
  const { store, add } = useCart();
  const variants = product.variantGroup?.variants;
  const [variantId, setVariantId] = React.useState<string | undefined>(
    undefined
  );
  const [quantity, setQuantity] = React.useState(1);
  const [needsVariant, setNeedsVariant] = React.useState(false);

  const selected = variants?.find((v) => v.id === variantId);
  const price = selected?.price ?? product.price;
  const soldOut = product.inventory === 0;

  function addToBag() {
    if (variants && !variantId) {
      setNeedsVariant(true);
      return;
    }
    add(product.id, variantId, quantity);
  }

  return (
    <div>
      <h1 className="sf-display text-3xl leading-tight md:text-4xl lg:text-[2.75rem]">
        {product.title}
      </h1>
      <p className="mt-3 text-xl">
        {product.compareAt && (
          <span className="mr-2.5 text-sf-muted line-through">
            {formatMoney(product.compareAt, store.currency)}
          </span>
        )}
        <span
          className={cn(
            "font-semibold",
            product.compareAt && "text-sf-brand"
          )}
        >
          {formatMoney(price, store.currency)}
        </span>
      </p>

      {/* variants */}
      {variants && (
        <fieldset className="mt-7">
          <legend className="text-sm font-semibold">
            {product.variantGroup!.label}
            {needsVariant && (
              <span className="ml-2 font-normal text-sf-brand" role="alert">
                — pick one first
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
          {selected && selected.stock <= 5 && (
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
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="p-3.5 transition-opacity hover:opacity-60"
          >
            <Minus className="size-4" />
          </button>
          <span
            className="w-8 text-center text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
            className="p-3.5 transition-opacity hover:opacity-60"
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
        <AccordionItem value="shipping" className="border-sf-line">
          <AccordionTrigger>Shipping & returns</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-sf-muted">
            {store.shippingNote} Orders placed before 2pm ship the same day
            from {store.address.split(",").slice(-2).join(",").trim()}.
          </AccordionContent>
        </AccordionItem>
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
            : `Add to bag · ${formatMoney(price * quantity, store.currency)}`}
        </button>
      </div>
      {/* spacer so the sticky bar never covers content */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
