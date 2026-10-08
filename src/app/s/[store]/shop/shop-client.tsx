"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useCart } from "@/components/storefront/cart-context";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { themeStyle } from "@/lib/store-theme";
import { cn, formatMoney } from "@/lib/utils";

type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

const PAGE_SIZE = 8;

export function ShopClient() {
  const { store } = useCart();
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get("collection");

  const active = store.products.filter((p) => p.status === "active");
  const maxPrice = Math.ceil(Math.max(...active.map((p) => p.price)) / 10) * 10;

  const [collections, setCollections] = React.useState<Set<string>>(
    () =>
      new Set(
        initialCollection
          ? store.categories
              .filter((c) => c.slug === initialCollection)
              .map((c) => c.id)
          : []
      )
  );
  const [price, setPrice] = React.useState<[number, number]>([0, maxPrice]);
  const [options, setOptions] = React.useState<Set<string>>(new Set());
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = React.useState(false);

  /* variant facets, e.g. Size -> [US 8, US 9…], Finish -> [Invisible…] */
  const facets = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    active.forEach((p) => {
      if (!p.variantGroup) return;
      const set = map.get(p.variantGroup.label) ?? new Set<string>();
      p.variantGroup.variants.forEach((v) => set.add(v.name));
      map.set(p.variantGroup.label, set);
    });
    return [...map.entries()].map(([label, values]) => ({
      label,
      values: [...values],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  const filtered = React.useMemo(() => {
    let list = active.filter((p) => {
      if (collections.size && !collections.has(p.categoryId)) return false;
      if (p.price < price[0] || p.price > price[1]) return false;
      if (inStockOnly && p.inventory === 0) return false;
      if (options.size) {
        const names = p.variantGroup?.variants.map((v) => v.name) ?? [];
        if (![...options].some((o) => names.includes(o))) return false;
      }
      return true;
    });
    switch (sort) {
      case "newest":
        list = [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      default:
        list = [...list].sort(
          (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
        );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, price, options, inStockOnly, sort, store.id]);

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;
  const filterCount =
    collections.size +
    options.size +
    (inStockOnly ? 1 : 0) +
    (price[0] > 0 || price[1] < maxPrice ? 1 : 0);

  function loadMore() {
    setLoadingMore(true);
    setTimeout(() => {
      setVisible((v) => v + PAGE_SIZE);
      setLoadingMore(false);
    }, 600);
  }

  function clearAll() {
    setCollections(new Set());
    setOptions(new Set());
    setInStockOnly(false);
    setPrice([0, maxPrice]);
  }

  const filtersPanel = (
    <div className="space-y-7">
      <FacetGroup title="Collection">
        {store.categories.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-2.5 py-1 text-sm"
          >
            <Checkbox
              checked={collections.has(c.id)}
              onCheckedChange={(v) =>
                setCollections((s) => {
                  const next = new Set(s);
                  if (v) next.add(c.id);
                  else next.delete(c.id);
                  return next;
                })
              }
              className="data-[state=checked]:border-sf-brand data-[state=checked]:bg-sf-brand"
            />
            {c.name}
          </label>
        ))}
      </FacetGroup>

      <FacetGroup title="Price">
        <Slider
          value={price}
          min={0}
          max={maxPrice}
          step={5}
          onValueChange={(v) => setPrice(v as [number, number])}
          aria-label="Price range"
          className="mt-2 text-sf-brand"
        />
        <p className="mt-2.5 text-xs text-sf-muted">
          {formatMoney(price[0], store.currency)} —{" "}
          {formatMoney(price[1], store.currency)}
        </p>
      </FacetGroup>

      {facets.map((f) => (
        <FacetGroup key={f.label} title={f.label}>
          <div className="flex flex-wrap gap-2">
            {f.values.map((v) => {
              const on = options.has(v);
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setOptions((s) => {
                      const next = new Set(s);
                      if (next.has(v)) next.delete(v);
                      else next.add(v);
                      return next;
                    })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                    on
                      ? "border-sf-brand bg-sf-brand text-sf-on-brand"
                      : "border-sf-line hover:border-sf-ink"
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </FacetGroup>
      ))}

      <FacetGroup title="Availability">
        <label className="flex cursor-pointer items-center justify-between py-1 text-sm">
          In stock only
          <Switch
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
            className="data-[state=checked]:bg-sf-brand"
          />
        </label>
      </FacetGroup>

      {filterCount > 0 && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <X className="size-3.5" />
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="sf-display text-4xl md:text-5xl">Shop</h1>
          <p className="mt-2 text-sm text-sf-muted" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* mobile filters */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-sf-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-sf-ink lg:hidden">
                <SlidersHorizontal className="size-4" />
                Filters
                {filterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-sf-brand text-[11px] font-bold text-sf-on-brand">
                    {filterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="storefront bg-sf-bg px-5 pb-10 pt-5 text-sf-ink"
              style={themeStyle(store.theme)}
            >
              <SheetTitle className="sf-display mb-5 text-xl">
                Filters
              </SheetTitle>
              <div className="max-h-[60dvh] overflow-y-auto pr-2">
                {filtersPanel}
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger
              className="h-10 w-44 rounded-full border-sf-line bg-transparent text-sf-ink focus:border-sf-ink focus:ring-0"
              aria-label="Sort products"
            >
              <span className="text-[13px]">
                {
                  {
                    featured: "Featured",
                    newest: "Newest",
                    "price-asc": "Price: low to high",
                    "price-desc": "Price: high to low",
                  }[sort]
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr]">
        {/* desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filtersPanel}</div>
        </aside>

        {/* grid */}
        <div>
          {shown.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl bg-sf-wash px-6 py-20 text-center">
              <p className="sf-display text-2xl">Nothing matches</p>
              <p className="mt-2 max-w-sm text-sm text-sf-muted">
                No products fit those filters. Loosen one or two and more will
                appear.
              </p>
              <button
                onClick={clearAll}
                className="mt-6 rounded-full bg-sf-brand px-6 py-3 text-sm font-semibold text-sf-on-brand transition-colors hover:bg-sf-brand-hover"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <Stagger className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
                {shown.map((p, i) => (
                  <StaggerItem key={p.id}>
                    <ProductCard product={p} priority={i < 4} />
                  </StaggerItem>
                ))}
                {loadingMore &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <ProductSkeleton key={`sk-${i}`} />
                  ))}
              </Stagger>
              {hasMore && !loadingMore && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="rounded-full border border-sf-ink px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-sf-ink hover:text-sf-bg"
                  >
                    Load more ({filtered.length - visible} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function ProductSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <div className="mt-3 flex justify-between gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
