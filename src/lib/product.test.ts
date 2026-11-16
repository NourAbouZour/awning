import { describe, it, expect } from "vitest";
import {
  cardPrice,
  cardWasPrice,
  effectiveSale,
  isSoldOut,
  normalizePhone,
  stockFor,
  unitPrice,
  withSale,
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

describe("sales", () => {
  it("applies only on a plan with sales, and takes the bigger of product and collection", () => {
    expect(effectiveSale("stall", 20, 30)).toBe(0);
    expect(effectiveSale("shopfront", 20, 30)).toBe(30);
    expect(effectiveSale("arcade", 25, 10)).toBe(25);
    expect(effectiveSale("shopfront", null, undefined)).toBe(0);
    expect(effectiveSale("shopfront", 150, 0)).toBe(90);
  });
  it("takes a percentage off and rounds to cents", () => {
    expect(withSale(100, 20)).toBe(80);
    expect(withSale(19.99, 15)).toBe(16.99);
    expect(withSale(50, 0)).toBe(50);
    expect(withSale(50, undefined)).toBe(50);
  });
  it("shows the sale price on cards with the old price crossed out", () => {
    const onSale = { ...base, sale: 25 };
    expect(cardPrice(onSale)).toBe(15);
    expect(cardWasPrice(onSale)).toBe(20);
    expect(cardWasPrice(base)).toBeUndefined();
    expect(cardWasPrice({ ...base, compareAt: 30 })).toBe(30);
  });
  it("charges the sale price in the bag, and wholesale when that is lower", () => {
    const p = { ...base, sale: 10, wholesalePrice: 15, wholesaleMinQty: 5 };
    expect(unitPrice(p, undefined, 1, true)).toBe(18);
    expect(unitPrice(p, undefined, 5, true)).toBe(15);
    expect(unitPrice(withVariants && { ...withVariants, sale: 50 }, "l", 1, false)).toBe(15);
  });
});
