import { describe, test, expect } from "bun:test";
import { StatusOverviewService } from "../../src/services/status-overview.service";

describe("StatusOverviewService & Functions Status Engine", () => {
  const service = new StatusOverviewService();

  test("getComprehensiveStatus returns valid structure with subsystems and applications", async () => {
    const report = await service.getComprehensiveStatus();
    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(["operational", "degraded", "down"]).toContain(report.overallStatus);
    expect(Array.isArray(report.subsystems)).toBe(true);
    expect(report.subsystems.length).toBeGreaterThan(5);

    // Verify key subsystems exist
    const subsystemIds = report.subsystems.map((s) => s.id);
    expect(subsystemIds).toContain("api");
    expect(subsystemIds).toContain("database");
    expect(subsystemIds).toContain("redis");
    expect(subsystemIds).toContain("worker");
    expect(subsystemIds).toContain("docker");
    expect(subsystemIds).toContain("pm2");
    expect(subsystemIds).toContain("nginx");
    expect(subsystemIds).toContain("autodeploy_engine");

    // Verify system telemetry structure
    expect(report.systemTelemetry).toBeDefined();
    expect(typeof report.systemTelemetry.cpuPercent).toBe("number");
    expect(typeof report.systemTelemetry.memoryPercent).toBe("number");
    expect(typeof report.systemTelemetry.uptime).toBe("number");
  });

  test("checkAndSyncAutoDeploy returns structured result without throwing", async () => {
    const result = await service.checkAndSyncAutoDeploy();
    expect(result).toBeDefined();
    expect(typeof result.checkedCount).toBe("number");
    expect(typeof result.triggeredCount).toBe("number");
    expect(Array.isArray(result.results)).toBe(true);
  });
});
