import { describe, it, expect } from "vitest";
import { applyDiscount, cleanCode } from "./discount";

describe("applyDiscount", () => {
  it("takes a percentage off", () => {
    expect(applyDiscount({ kind: "percent", value: 10, active: true }, 80)).toEqual({
      ok: true,
      amount: 8,
    });
  });
  it("takes a fixed amount off, never below zero", () => {
    expect(applyDiscount({ kind: "fixed", value: 5, active: true }, 30)).toEqual({
      ok: true,
      amount: 5,
    });
    expect(applyDiscount({ kind: "fixed", value: 50, active: true }, 30)).toEqual({
      ok: true,
      amount: 30,
    });
  });
  it("respects the minimum order total", () => {
    const r = applyDiscount({ kind: "percent", value: 10, minTotal: 50, active: true }, 40);
    expect(r.ok).toBe(false);
    expect(applyDiscount({ kind: "percent", value: 10, minTotal: 50, active: true }, 50).ok).toBe(true);
  });
  it("rejects inactive codes", () => {
    expect(applyDiscount({ kind: "percent", value: 10, active: false }, 80).ok).toBe(false);
  });
  it("rounds to cents", () => {
    expect(applyDiscount({ kind: "percent", value: 15, active: true }, 19.99)).toEqual({
      ok: true,
      amount: 3,
    });
  });
});

describe("cleanCode", () => {
  it("uppercases and dashes spaces", () => {
    expect(cleanCode("  summer sale ")).toBe("SUMMER-SALE");
  });
});
