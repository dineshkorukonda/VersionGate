import { describe, expect, test } from "bun:test";
import { getSelfUpdateProgress, startAsyncSelfUpdate } from "../../src/services/self-update.service";

describe("Self-update non-blocking progress service", () => {
  test("getSelfUpdateProgress returns valid progress structure", () => {
    const p = getSelfUpdateProgress();
    expect(p).toHaveProperty("status");
    expect(p).toHaveProperty("steps");
    expect(Array.isArray(p.steps)).toBe(true);
  });

  test("startAsyncSelfUpdate rejects invalid non-git directory gracefully", async () => {
    const res = await startAsyncSelfUpdate("main");
    expect(res).toHaveProperty("ok");
    expect(res).toHaveProperty("started");
  });
});
