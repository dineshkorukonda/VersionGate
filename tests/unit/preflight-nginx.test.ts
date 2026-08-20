import { describe, test, expect } from "bun:test";
import { runPreflightChecks } from "../../src/services/preflight.service";

describe("Preflight Nginx Checks", () => {
  test("includes Nginx configuration write check in report", async () => {
    const report = await runPreflightChecks();
    const nginxCheck = report.checks.find((c) => c.id === "nginx_config_writable");
    expect(nginxCheck).toBeDefined();
  }, 15000);
});
