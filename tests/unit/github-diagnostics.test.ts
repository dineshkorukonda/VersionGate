import { describe, test, expect } from "bun:test";
import {
  verifyRelayHopSignature,
  probeRelayReachability,
  signRegisterPayload,
} from "../../src/utils/github/github-relay";

describe("GitHub Diagnostics & Relay Utilities", () => {
  test("verifyRelayHopSignature validates valid HMAC signature and rejects mismatch", () => {
    const secret = "test_shared_secret_123";
    const installationId = "67554316";
    const body = Buffer.from(JSON.stringify({ test: "payload" }), "utf8");

    // Manually compute expected signature
    const { createHmac } = require("crypto");
    const validHex = createHmac("sha256", secret)
      .update(`${installationId}.`, "utf8")
      .update(body)
      .digest("hex");

    expect(verifyRelayHopSignature(body, installationId, `sha256=${validHex}`, secret)).toBe(true);
    expect(verifyRelayHopSignature(body, installationId, "sha256=invalidhex", secret)).toBe(false);
    expect(verifyRelayHopSignature(body, installationId, undefined, secret)).toBe(false);
  });

  test("signRegisterPayload creates base64url signed token containing payload and signature", () => {
    const payload = {
      instanceUrl: "https://myvg.example.com",
      installationId: "123456",
      userId: "usr_abc",
      ts: Date.now(),
    };
    const secret = "test_relay_sec";
    const token = signRegisterPayload(payload, secret);

    expect(typeof token).toBe("string");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    expect(decoded.p.installationId).toBe("123456");
    expect(decoded.p.instanceUrl).toBe("https://myvg.example.com");
    expect(typeof decoded.sig).toBe("string");
  });

  test("probeRelayReachability handles invalid/unreachable host without crashing", async () => {
    const probe = await probeRelayReachability({
      relayOrigin: "http://127.0.0.1:59999", // Unused port
      timeoutMs: 1000,
    });

    expect(probe.reachable).toBe(false);
    expect(typeof probe.latencyMs).toBe("number");
    expect(probe.origin).toBe("http://127.0.0.1:59999");
  });
});
