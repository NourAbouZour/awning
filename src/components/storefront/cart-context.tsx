"use client";

/**
 * Per-store cart state. Lives at the storefront layout so the drawer, the
 * header badge, and every "Add to bag" button share one source of truth.
 * UI-only: state is in-memory per visit.
 */
import * as React from "react";
import type { Product, Store } from "@/lib/types";

export interface CartLineView {
  key: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  store: Store;
  lines: CartLineView[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (productId: string, variantId?: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
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

export function CartProvider({
  store,
  children,
}: {
  store: Store;
  children: React.ReactNode;
}) {
  const [lines, setLines] = React.useState<Line[]>([]);
  const [open, setOpen] = React.useState(false);

  const add = React.useCallback(
    (productId: string, variantId?: string, quantity = 1) => {
      setLines((ls) => {
        const key = `${productId}:${variantId ?? ""}`;
        const existing = ls.find(
          (l) => `${l.productId}:${l.variantId ?? ""}` === key
        );
        if (existing) {
          return ls.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + quantity } : l
          );
        }
        return [...ls, { productId, variantId, quantity }];
      });
      setOpen(true);
    },
    []
  );

  const setQuantity = React.useCallback((key: string, quantity: number) => {
    setLines((ls) =>
      quantity <= 0
        ? ls.filter((l) => `${l.productId}:${l.variantId ?? ""}` !== key)
        : ls.map((l) =>
            `${l.productId}:${l.variantId ?? ""}` === key
              ? { ...l, quantity }
              : l
          )
    );
  }, []);

  const remove = React.useCallback((key: string) => {
    setLines((ls) =>
      ls.filter((l) => `${l.productId}:${l.variantId ?? ""}` !== key)
    );
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const view: CartLineView[] = lines.flatMap((l) => {
    const product = store.products.find((p) => p.id === l.productId);
    if (!product) return [];
    const variant = product.variantGroup?.variants.find(
      (v) => v.id === l.variantId
    );
    return [
      {
        key: `${l.productId}:${l.variantId ?? ""}`,
        product,
        variantId: l.variantId,
        variantName: variant?.name,
        unitPrice: variant?.price ?? product.price,
        quantity: l.quantity,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
