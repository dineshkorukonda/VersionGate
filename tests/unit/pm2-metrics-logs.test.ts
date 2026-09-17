import { describe, test, expect } from "bun:test";
import { getProjectMetricsHandler, getProjectLogsHandler } from "../../src/controllers/metrics.controller";

describe("PM2 Metrics and Runtime Logs Controller", () => {
  test("getProjectMetricsHandler is exported as a Fastify handler", () => {
    expect(typeof getProjectMetricsHandler).toBe("function");
  });

  test("getProjectLogsHandler is exported as a Fastify handler", () => {
    expect(typeof getProjectLogsHandler).toBe("function");
  });
});
