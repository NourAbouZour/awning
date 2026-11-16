import { describe, it, expect } from "vitest";
import {
  FREE_PRODUCT_LIMIT,
  limitReached,
  productLimit,
  hasFeature,
  planFor,
} from "./plan";

describe("productLimit", () => {
  it("caps Stall at the free limit and leaves paid plans unlimited", () => {
    expect(productLimit("stall")).toBe(FREE_PRODUCT_LIMIT);
    expect(productLimit("shopfront")).toBe(Infinity);
    expect(productLimit("arcade")).toBe(Infinity);
  });
});

describe("limitReached", () => {
  it("blocks Stall at 5 and never blocks paid plans", () => {
    expect(limitReached(0, "stall")).toBe(false);
    expect(limitReached(FREE_PRODUCT_LIMIT - 1, "stall")).toBe(false);
    expect(limitReached(FREE_PRODUCT_LIMIT, "stall")).toBe(true);
    expect(limitReached(FREE_PRODUCT_LIMIT + 3, "stall")).toBe(true);
    expect(limitReached(1000, "shopfront")).toBe(false);
    expect(limitReached(1000, "arcade")).toBe(false);
  });
});

describe("hasFeature", () => {
  it("gives Stall no paid features", () => {
    expect(hasFeature("stall", "discounts")).toBe(false);
    expect(hasFeature("stall", "api")).toBe(false);
  });
  it("gives Shopfront its own features but not Arcade's", () => {
    expect(hasFeature("shopfront", "discounts")).toBe(true);
    expect(hasFeature("shopfront", "abandonedCart")).toBe(true);
    expect(hasFeature("shopfront", "staff")).toBe(false);
  });
  it("gives Arcade everything", () => {
    expect(hasFeature("arcade", "discounts")).toBe(true);
    expect(hasFeature("arcade", "staff")).toBe(true);
    expect(hasFeature("arcade", "api")).toBe(true);
  });
  it("names the cheapest plan for a feature", () => {
    expect(planFor("upsell")).toBe("shopfront");
    expect(planFor("wholesale")).toBe("arcade");
  });
});
