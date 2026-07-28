import { describe, test, expect } from "bun:test";
import { engineHealthMonitor } from "../../src/services/engine-monitor.service";

describe("EngineHealthMonitorService", () => {
  test("returns valid initial health report", () => {
    const report = engineHealthMonitor.getLatestReport();
    expect(report).toBeDefined();
    expect(["ok", "degraded", "error"]).toContain(report.status);
    expect(report.database).toBeDefined();
    expect(report.redis).toBeDefined();
    expect(report.containers).toBeDefined();
    expect(report.system).toBeDefined();
    expect(Array.isArray(report.alerts)).toBe(true);
  });
});
