import { describe, it, expect } from "vitest";
import {
  cardPrice,
  isSoldOut,
  normalizePhone,
  stockFor,
  unitPrice,
} from "./product";
import type { Product } from "./types";

const base: Product = {
  id: "p1",
  slug: "tee",
  title: "Tee",
  description: "",
  details: "",
  price: 20,
  images: [],
  categoryId: "c1",
  inventory: 4,
  sku: "",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
};

const withVariants: Product = {
  ...base,
  inventory: 3,
  variantGroup: {
    label: "Size",
    variants: [
      { id: "s", name: "S", stock: 0 },
      { id: "m", name: "M", price: 25, stock: 2, isDefault: true },
      { id: "l", name: "L", price: 30, stock: 1 },
    ],
  },
};

describe("cardPrice", () => {
  it("uses the product price without variants", () => {
    expect(cardPrice(base)).toBe(20);
  });
  it("uses the variant marked for the card", () => {
    expect(cardPrice(withVariants)).toBe(25);
  });
});

describe("stock", () => {
  it("reads product or variant stock", () => {
    expect(stockFor(base)).toBe(4);
    expect(stockFor(withVariants, "m")).toBe(2);
    expect(stockFor(withVariants, "s")).toBe(0);
    expect(stockFor(withVariants)).toBe(0);
  });
  it("is sold out only when every variant is empty", () => {
    expect(isSoldOut(withVariants)).toBe(false);
    expect(isSoldOut({ ...base, inventory: 0 })).toBe(true);
  });
});

describe("unitPrice", () => {
  const bulk = { ...base, wholesalePrice: 15, wholesaleMinQty: 10 };
  it("applies wholesale from the minimum quantity when the plan has it", () => {
    expect(unitPrice(bulk, undefined, 9, true)).toBe(20);
    expect(unitPrice(bulk, undefined, 10, true)).toBe(15);
    expect(unitPrice(bulk, undefined, 10, false)).toBe(20);
  });
});

describe("normalizePhone", () => {
  it("turns Lebanese local numbers into 961 form", () => {
    expect(normalizePhone("03 123 456")).toBe("9613123456");
    expect(normalizePhone("71 123 456")).toBe("96171123456");
    expect(normalizePhone("+961 71 123 456")).toBe("96171123456");
    expect(normalizePhone("0096171123456")).toBe("96171123456");
  });
});
