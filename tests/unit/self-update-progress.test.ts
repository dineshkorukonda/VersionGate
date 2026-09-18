import { describe, expect, test } from "bun:test";
import { getSelfUpdateProgress, resetSelfUpdateProgress, selfUpdateTokensMatch } from "../../src/services/self-update.service";

describe("Self-update non-blocking progress service", () => {
  test("getSelfUpdateProgress returns valid progress structure", () => {
    const p = getSelfUpdateProgress();
    expect(p).toHaveProperty("status");
    expect(p).toHaveProperty("steps");
    expect(Array.isArray(p.steps)).toBe(true);
  });

  test("resetSelfUpdateProgress resets progress state when not running", () => {
    resetSelfUpdateProgress();
    const p = getSelfUpdateProgress();
    expect(p.status).toBe("idle");
    expect(p.steps.length).toBe(0);
  });

  test("selfUpdateTokensMatch securely validates matching tokens", () => {
    expect(selfUpdateTokensMatch("secret-token-123", "secret-token-123")).toBe(true);
    expect(selfUpdateTokensMatch("secret-token-123", "wrong-token-456")).toBe(false);
  });
});
