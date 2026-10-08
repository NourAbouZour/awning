import { describe, it, expect } from "vitest";
import { decToNum, toProduct } from "./adapters";

// A Decimal-like value (Prisma returns objects whose toString/valueOf give the
// number). We simulate that here so the adapter is tested without a live DB.
const dec = (n: number) => ({ toString: () => String(n) });

describe("decToNum", () => {
  it("converts a Decimal-like to a number and maps null/undefined to undefined", () => {
    expect(decToNum(dec(49))).toBe(49);
    expect(decToNum(null)).toBeUndefined();
    expect(decToNum(undefined)).toBeUndefined();
  });
});

describe("toProduct", () => {
  const base = {
    id: "p1",
    slug: "runner",
    title: "Runner",
    description: "desc",
    details: "details",
    price: dec(120),
    compareAt: dec(150),
    categoryId: "c1",
    images: ["a.jpg", "b.jpg"],
    inventory: 12,
    sku: "RUN-1",
    status: "active" as const,
    featured: true,
    variantGroupLabel: "Size",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    variants: [
      { id: "v1", name: "US 9", price: dec(130), stock: 3 },
      { id: "v2", name: "US 10", price: null, stock: 0 },
    ],
  };

  it("maps Decimal money to numbers and keeps the images array", () => {
    const p = toProduct(base);
    expect(p.price).toBe(120);
    expect(p.compareAt).toBe(150);
    expect(p.images).toEqual(["a.jpg", "b.jpg"]);
    expect(p.status).toBe("active");
  });

  it("builds a variantGroup from the label and variant rows", () => {
    const p = toProduct(base);
    expect(p.variantGroup).toEqual({
      label: "Size",
      variants: [
        { id: "v1", name: "US 9", price: 130, stock: 3 },
        { id: "v2", name: "US 10", stock: 0 },
      ],
    });
  });

  it("omits variantGroup when there is no label or no variants", () => {
    const p = toProduct({ ...base, variantGroupLabel: null, variants: [] });
    expect(p.variantGroup).toBeUndefined();
  });
});
