import { describe, it, expect } from "vitest";
import {
  FREE_PRODUCT_LIMIT,
  TRIAL_DAYS,
  trialStatus,
  limitReached,
  productLimit,
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

describe("trialStatus", () => {
  const created = new Date("2026-01-01T00:00:00Z");

  it("is active with full days left on day zero", () => {
    const s = trialStatus(created, created);
    expect(s.active).toBe(true);
    expect(s.daysLeft).toBe(TRIAL_DAYS);
  });

  it("counts down while inside the trial window", () => {
    const now = new Date("2026-01-25T00:00:00Z"); // 24 days in
    const s = trialStatus(created, now);
    expect(s.active).toBe(true);
    expect(s.daysLeft).toBe(6);
  });

  it("is ended with zero days left after the window", () => {
    const now = new Date("2026-03-01T00:00:00Z");
    const s = trialStatus(created, now);
    expect(s.active).toBe(false);
    expect(s.daysLeft).toBe(0);
  });
});
