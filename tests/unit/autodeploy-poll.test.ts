import { describe, test, expect } from "bun:test";
import {
  startAutoDeployPoll,
  stopAutoDeployPoll,
  isAutoDeployPollActive,
} from "../../src/services/autodeploy-poll.service";

describe("AutoDeployPollService", () => {
  test("scheduler starts and stops cleanly without leaking timers", () => {
    stopAutoDeployPoll();
    expect(isAutoDeployPollActive()).toBe(false);

    startAutoDeployPoll(10000);
    expect(isAutoDeployPollActive()).toBe(true);

    stopAutoDeployPoll();
    expect(isAutoDeployPollActive()).toBe(false);
  });
});
