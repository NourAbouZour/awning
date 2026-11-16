"use client";

/**
 * Per-store cart state. Lives at the storefront layout so the drawer, the
 * header badge, and every "Add to bag" button share one source of truth.
 * Quantities never go above the stock set for the product (or variant).
 */
import * as React from "react";
import type { Product, Store } from "@/lib/types";
import { hasFeature } from "@/lib/plan";
import { stockFor, unitPrice } from "@/lib/product";

export interface CartLineView {
  key: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  /** Regular price, so the bag can show when wholesale applies. */
  regularPrice: number;
  quantity: number;
  /** Units in stock for this line. */
  stock: number;
}

interface CartContextValue {
  store: Store;
  lines: CartLineView[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Adds up to the stock left; returns how many were actually added. */
  add: (productId: string, variantId?: string, quantity?: number) => number;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** How many more of this product/variant can still go in the bag. */
  remaining: (productId: string, variantId?: string) => number;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a storefront");
  return ctx;
}

interface Line {
  productId: string;
  variantId?: string;
  quantity: number;
}

const keyOf = (productId: string, variantId?: string) =>
  `${productId}:${variantId ?? ""}`;

export function CartProvider({
  store,
  children,
}: {
  store: Store;
  children: React.ReactNode;
}) {
  const [lines, setLines] = React.useState<Line[]>([]);
  const [open, setOpen] = React.useState(false);
  const wholesaleOn = hasFeature(store.plan, "wholesale");

  const stockOf = React.useCallback(
    (productId: string, variantId?: string) => {
      const product = store.products.find((p) => p.id === productId);
      return product ? stockFor(product, variantId) : 0;
    },
    [store.products],
  );

  const remaining = React.useCallback(
    (productId: string, variantId?: string) => {
      const inBag =
        lines.find((l) => keyOf(l.productId, l.variantId) === keyOf(productId, variantId))
          ?.quantity ?? 0;
      return Math.max(0, stockOf(productId, variantId) - inBag);
    },
    [lines, stockOf],
  );

  const add = React.useCallback(
    (productId: string, variantId?: string, quantity = 1) => {
      const room = remaining(productId, variantId);
      const adding = Math.min(Math.max(1, quantity), room);
      if (adding <= 0) {
        setOpen(true);
        return 0;
      }
      setLines((ls) => {
        const key = keyOf(productId, variantId);
        const existing = ls.find((l) => keyOf(l.productId, l.variantId) === key);
        if (existing) {
          return ls.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + adding } : l,
          );
        }
        return [...ls, { productId, variantId, quantity: adding }];
      });
      setOpen(true);
      return adding;
    },
    [remaining],
  );

  const setQuantity = React.useCallback(
    (key: string, quantity: number) => {
      setLines((ls) =>
        quantity <= 0
          ? ls.filter((l) => keyOf(l.productId, l.variantId) !== key)
          : ls.map((l) =>
              keyOf(l.productId, l.variantId) === key
                ? {
                    ...l,
                    quantity: Math.min(quantity, stockOf(l.productId, l.variantId)),
                  }
                : l,
            ),
      );
    },
    [stockOf],
  );

  const remove = React.useCallback((key: string) => {
    setLines((ls) => ls.filter((l) => keyOf(l.productId, l.variantId) !== key));
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const view: CartLineView[] = lines.flatMap((l) => {
    const product = store.products.find((p) => p.id === l.productId);
    if (!product) return [];
    const variant = product.variantGroup?.variants.find(
      (v) => v.id === l.variantId,
    );
    return [
      {
        key: keyOf(l.productId, l.variantId),
        product,
        variantId: l.variantId,
        variantName: variant?.name,
        unitPrice: unitPrice(product, l.variantId, l.quantity, wholesaleOn),
        regularPrice: variant?.price ?? product.price,
        quantity: l.quantity,
        stock: stockFor(product, l.variantId),
      },
    ];
  });

  const count = view.reduce((s, l) => s + l.quantity, 0);
  const subtotal = view.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        store,
        lines: view,
        count,
        subtotal,
        open,
        setOpen,
        add,
        setQuantity,
        remove,
        clear,
        remaining,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
