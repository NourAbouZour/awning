import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/types";

/** At or below this many units, a product (or one of its options) counts as low. */
export const LOW_STOCK_AT = 10;

export interface LowStockItem {
  key: string;
  productId: string;
  name: string;
  /** The option that is low, for products sold in sizes/colours. */
  variant?: string;
  units: number;
}

/** Active products and options running low, the emptiest first. */
export function lowStockItems(products: Product[]): LowStockItem[] {
  const items: LowStockItem[] = [];
  for (const p of products) {
    if (p.status !== "active") continue;
    const variants = p.variantGroup?.variants;
    if (variants?.length) {
      for (const v of variants) {
        if (v.stock <= LOW_STOCK_AT) {
          items.push({
            key: `${p.id}:${v.id}`,
            productId: p.id,
            name: p.title,
            variant: v.name,
            units: Math.max(0, v.stock),
          });
        }
      }
    } else if (p.inventory <= LOW_STOCK_AT) {
      items.push({
        key: p.id,
        productId: p.id,
        name: p.title,
        units: Math.max(0, p.inventory),
      });
    }
  }
  return items.sort(
    (a, b) => a.units - b.units || a.name.localeCompare(b.name),
  );
}

/**
 * Horizontal bars of units left, one per low item, on a shared 0 to
 * LOW_STOCK_AT scale so the bars compare directly. Sold-out items have no
 * bar; an icon and label mark them, so status never rests on colour alone.
 */
export function LowStockChart({
  items,
  max = 6,
}: {
  items: LowStockItem[];
  max?: number;
}) {
  if (items.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center px-4 text-center text-sm text-ink-soft">
        Nothing is running low. Every active product has more than{" "}
        {LOW_STOCK_AT} in stock.
      </p>
    );
  }

  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;

  return (
    <div>
      <ul className="space-y-1">
        {shown.map((it) => {
          const label = it.variant ? `${it.name} · ${it.variant}` : it.name;
          const out = it.units === 0;
          return (
            <li key={it.key}>
              <Link
                href={`/dashboard/products/${it.productId}`}
                title={`${label}: ${out ? "out of stock" : `${it.units} left`}. Open to restock.`}
                className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] text-ink-body">
                    {label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums text-ink">
                    {out && (
                      <AlertTriangle
                        className="size-3.5 text-danger"
                        aria-hidden
                      />
                    )}
                    {out ? "Out of stock" : `${it.units} left`}
                  </span>
                </span>
                {/* the bar: square at the zero line, rounded at the data end */}
                <span
                  className="mt-1.5 block h-2 border-l border-line-strong"
                  aria-hidden
                >
                  {!out && (
                    <span
                      className="block h-2 rounded-r-[4px] bg-green"
                      style={{
                        width: `${Math.min(100, (it.units / LOW_STOCK_AT) * 100)}%`,
                      }}
                    />
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* scale */}
      <div
        className="mt-1 flex justify-between px-2 text-[11px] tabular-nums text-ink-soft"
        aria-hidden
      >
        <span>0</span>
        <span>{LOW_STOCK_AT} units</span>
      </div>
      {hidden > 0 && (
        <p className="mt-2 px-2 text-xs text-ink-soft">
          and {hidden} more low {hidden === 1 ? "item" : "items"} in{" "}
          <Link
            href="/dashboard/products"
            className="font-medium text-green underline-offset-4 hover:underline"
          >
            Products
          </Link>
        </p>
      )}
    </div>
  );
}
