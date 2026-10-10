import { describe, expect, test } from "bun:test";
import { createHmac } from "crypto";
import { verifyRelayQuerySignature } from "../../website/src/lib/relay-crypto";

describe("relay query authentication", () => {
  const secret = "configured-audit-test-secret";
  const sign = (payload: string, key = secret) => createHmac("sha256", key).update(payload).digest("hex");

  test("requires the configured key and exact requested resource", () => {
    for (const payload of ["repos:12345", "branches:12345:owner/private-repo"]) {
      expect(verifyRelayQuerySignature(payload, sign(payload), secret)).toBe(true);
      expect(verifyRelayQuerySignature(payload, "invalid", secret)).toBe(false);
      expect(verifyRelayQuerySignature(payload, "00".repeat(32), secret)).toBe(false);
      expect(verifyRelayQuerySignature(payload, sign(payload, "vg_relay_shared_secret"), secret)).toBe(false);
      expect(verifyRelayQuerySignature(payload, sign("repos:999"), secret)).toBe(false);
      expect(verifyRelayQuerySignature(payload, sign(payload), "")).toBe(false);
    }
  });
});
