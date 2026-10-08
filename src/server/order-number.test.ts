import { describe, it, expect } from "vitest";
import { nextOrderNumber } from "./order-number";

describe("nextOrderNumber", () => {
  it("starts at #1001 when there are no orders", () => {
    expect(nextOrderNumber([])).toBe("#1001");
  });

  it("returns one past the highest existing number", () => {
    expect(nextOrderNumber(["#1001", "#1003", "#1002"])).toBe("#1004");
  });

  it("ignores non-numeric noise and parses the digits", () => {
    expect(nextOrderNumber(["#1040", "ORD-1042"])).toBe("#1043");
  });
});
