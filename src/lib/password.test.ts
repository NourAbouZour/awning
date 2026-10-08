import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("awning123");
    expect(hash).not.toBe("awning123"); // stored value is hashed, not plaintext
    expect(await verifyPassword("awning123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
