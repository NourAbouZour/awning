"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/lib/types";

export function ProductCarousel({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-end justify-between">
          <h2 className="sf-display text-3xl md:text-4xl">{title}</h2>
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll back"
              className="flex size-10 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll forward"
              className="flex size-10 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 md:px-8 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[70vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-72"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
