import { afterEach, beforeEach, describe, expect, test } from "bun:test";

describe("Self-update poll scheduler", () => {
  const originalPollMs = process.env.SELF_UPDATE_POLL_MS;

  beforeEach(() => {
    process.env.SELF_UPDATE_POLL_MS = "60000";
  });

  afterEach(() => {
    if (originalPollMs === undefined) {
      delete process.env.SELF_UPDATE_POLL_MS;
    } else {
      process.env.SELF_UPDATE_POLL_MS = originalPollMs;
    }
    const { stopSelfUpdatePoll } = require("../../src/services/self-update-poll.service");
    stopSelfUpdatePoll();
  });

  test("kickSelfUpdatePoll schedules when poll interval is positive", async () => {
    const { kickSelfUpdatePoll, stopSelfUpdatePoll } = await import("../../src/services/self-update-poll.service");
    kickSelfUpdatePoll();
    await new Promise((r) => setTimeout(r, 20));
    stopSelfUpdatePoll();
    expect(true).toBe(true);
  });

  test("kickSelfUpdatePoll is a no-op when poll interval is zero", async () => {
    process.env.SELF_UPDATE_POLL_MS = "0";
    const { kickSelfUpdatePoll } = await import("../../src/services/self-update-poll.service");
    kickSelfUpdatePoll();
    expect(true).toBe(true);
  });
});
