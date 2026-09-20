import { describe, test, expect } from "bun:test";
import { parsePushPayload } from "../../src/controllers/webhook.controller";

describe("Webhook Ingress Parsing", () => {
  test("parses JSON payload", () => {
    const raw = JSON.stringify({ ref: "refs/heads/main" });
    const parsed = parsePushPayload(raw, "application/json");
    expect(parsed?.ref).toBe("refs/heads/main");
  });

  test("parses GitHub x-www-form-urlencoded payload", () => {
    const innerJson = JSON.stringify({ ref: "refs/heads/production" });
    const raw = `payload=${encodeURIComponent(innerJson)}`;
    const parsed = parsePushPayload(raw, "application/x-www-form-urlencoded");
    expect(parsed?.ref).toBe("refs/heads/production");
  });

  test("handles empty or malformed payload without throwing", () => {
    expect(parsePushPayload("", "application/json")).toBeNull();
    expect(parsePushPayload("not-json", "application/json")).toBeNull();
    expect(parsePushPayload("payload=bad-json", "application/x-www-form-urlencoded")).toBeNull();
  });
});
