"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import type { Product } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";

/**
 * Storefront product card: second image on hover, sale/sold-out badges,
 * quick-add. Quick-add goes straight to the bag when the product has no
 * variants; otherwise it links through to the product page to pick one.
 */
export function ProductCard({
  product,
  priority,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { store, add } = useCart();
  const base = `/s/${store.slug}`;
  const soldOut = product.inventory === 0;
  const onSale = !!product.compareAt;
  const hasVariants = !!product.variantGroup;

  return (
    <div className="group relative">
      <Link
        href={`${base}/product/${product.slug}`}
        className="block"
        aria-label={product.title}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sf-wash transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_34px_-20px_rgb(0_0_0/0.4)]">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
              className={cn(
                "object-cover transition-all duration-500",
                product.images[1] && "group-hover:opacity-0"
              )}
            />
          )}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
              className="object-cover opacity-0 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            />
          )}
          {/* badges */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {soldOut ? (
              <span className="rounded-full bg-sf-ink px-2.5 py-1 text-[11px] font-semibold text-sf-bg">
                Sold out
              </span>
            ) : (
              onSale && (
                <span className="rounded-full bg-sf-brand px-2.5 py-1 text-[11px] font-semibold text-sf-on-brand">
                  Sale
                </span>
              )
            )}
          </div>
        </div>
      </Link>

      {/* quick add */}
      {!soldOut &&
        (hasVariants ? (
          <Link
            href={`${base}/product/${product.slug}`}
            aria-label={`Choose options for ${product.title}`}
            className="absolute right-3 top-[calc(80%-3.75rem)] flex size-10 translate-y-1 items-center justify-center rounded-full bg-sf-bg text-sf-ink opacity-0 shadow-md transition-all duration-200 hover:bg-sf-brand hover:text-sf-on-brand focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Plus className="size-4" />
          </Link>
        ) : (
          <button
            onClick={() => add(product.id)}
            aria-label={`Add ${product.title} to bag`}
            className="absolute right-3 top-[calc(80%-3.75rem)] flex size-10 translate-y-1 items-center justify-center rounded-full bg-sf-bg text-sf-ink opacity-0 shadow-md transition-all duration-200 hover:bg-sf-brand hover:text-sf-on-brand focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 active:scale-90"
          >
            <Plus className="size-4" />
          </button>
        ))}

      <div className="mt-3 flex items-start justify-between gap-3">
        <Link
          href={`${base}/product/${product.slug}`}
          className="min-w-0 text-sm font-medium leading-snug hover:underline"
        >
          {product.title}
        </Link>
        <p className="shrink-0 text-sm tabular-nums">
          {onSale && (
            <span className="mr-1.5 text-sf-muted line-through">
              {formatMoney(product.compareAt!, store.currency)}
            </span>
          )}
          <span className={cn("font-semibold", onSale && "text-sf-brand")}>
            {formatMoney(product.price, store.currency)}
          </span>
        </p>
      </div>
    </div>
  );
}
