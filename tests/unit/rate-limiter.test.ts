import { describe, expect, it, beforeEach } from "bun:test";
import {
  checkRateLimit,
  resetRateLimit,
  resetAllRateLimits,
} from "../../src/utils/rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  it("allows requests under the limit", () => {
    const key = "test:under-limit";
    expect(checkRateLimit(key, 3, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, 2_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, 3_000).allowed).toBe(true);
  });

  it("blocks requests at the limit and returns retryAfterMs", () => {
    const key = "test:at-limit";
    const windowMs = 10_000;
    const now = 5_000;

    expect(checkRateLimit(key, 2, windowMs, now).allowed).toBe(true);
    expect(checkRateLimit(key, 2, windowMs, now + 100).allowed).toBe(true);

    const blocked = checkRateLimit(key, 2, windowMs, now + 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(windowMs);
  });

  it("expires timestamps outside the sliding window", () => {
    const key = "test:sliding-window";
    const windowMs = 5_000;

    expect(checkRateLimit(key, 1, windowMs, 0).allowed).toBe(true);
    expect(checkRateLimit(key, 1, windowMs, 6_000).allowed).toBe(true);
  });

  it("isolates buckets by key", () => {
    expect(checkRateLimit("key-a", 1, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit("key-b", 1, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit("key-a", 1, 60_000, 1_100).allowed).toBe(false);
    expect(checkRateLimit("key-b", 1, 60_000, 1_100).allowed).toBe(false);
  });

  it("resetRateLimit clears a single bucket", () => {
    const key = "test:reset";
    expect(checkRateLimit(key, 1, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 60_000, 1_100).allowed).toBe(false);

    resetRateLimit(key);
    expect(checkRateLimit(key, 1, 60_000, 1_200).allowed).toBe(true);
  });
});
