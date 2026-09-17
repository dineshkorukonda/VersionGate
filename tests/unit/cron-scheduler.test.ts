import { describe, expect, it } from "bun:test";
import { isCronMatch, matchCronField, cronRunnerService } from "../../src/services/cron-runner.service";
import { serverSpecsService } from "../../src/services/server-specs.service";
import {
  listCronJobsHandler,
  createCronJobHandler,
  getCronJobHandler,
  updateCronJobHandler,
  deleteCronJobHandler,
  triggerCronJobHandler,
  getCronJobLogsHandler,
  getServerCapacitySpecsHandler,
} from "../../src/controllers/cron.controller";

describe("Cron Pattern Parser & Matcher", () => {
  it("matches wildcard asterisk correctly", () => {
    expect(matchCronField("*", 0)).toBe(true);
    expect(matchCronField("*", 45)).toBe(true);
  });

  it("matches step intervals correctly", () => {
    expect(matchCronField("*/15", 0)).toBe(true);
    expect(matchCronField("*/15", 15)).toBe(true);
    expect(matchCronField("*/15", 30)).toBe(true);
    expect(matchCronField("*/15", 45)).toBe(true);
    expect(matchCronField("*/15", 10)).toBe(false);
    expect(matchCronField("*/15", 7)).toBe(false);
  });

  it("matches lists of numbers correctly", () => {
    expect(matchCronField("1,15,30", 1)).toBe(true);
    expect(matchCronField("1,15,30", 15)).toBe(true);
    expect(matchCronField("1,15,30", 30)).toBe(true);
    expect(matchCronField("1,15,30", 2)).toBe(false);
  });

  it("matches ranges correctly", () => {
    expect(matchCronField("1-5", 1)).toBe(true);
    expect(matchCronField("1-5", 3)).toBe(true);
    expect(matchCronField("1-5", 5)).toBe(true);
    expect(matchCronField("1-5", 0)).toBe(false);
    expect(matchCronField("1-5", 6)).toBe(false);
  });

  it("evaluates 5-part cron expressions accurately against Date instances", () => {
    // 2026-09-17 14:30:00 (Thursday = day 4)
    const testDate = new Date(2026, 8, 17, 14, 30, 0);

    expect(isCronMatch("30 14 * * *", testDate)).toBe(true);
    expect(isCronMatch("*/15 14 * * *", testDate)).toBe(true);
    expect(isCronMatch("0 14 * * *", testDate)).toBe(false);
    expect(isCronMatch("30 15 * * *", testDate)).toBe(false);
    expect(isCronMatch("30 14 17 9 *", testDate)).toBe(true);
    expect(isCronMatch("30 14 * * 4", testDate)).toBe(true);
    expect(isCronMatch("30 14 * * 0", testDate)).toBe(false);
  });
});

describe("Server Hardware Capacity & Recommendation Specs", () => {
  it("calculates server capacity and hardware specs", () => {
    const specs = serverSpecsService.getServerCapacity();

    expect(specs.hardware.cpuCores).toBeGreaterThan(0);
    expect(specs.hardware.totalMemoryMb).toBeGreaterThan(0);
    expect(specs.hardware.totalMemoryGb).toBeGreaterThan(0);
    expect(Array.isArray(specs.hardware.loadAverage)).toBe(true);

    expect(specs.recommendations.database.memoryLimit).toBeTruthy();
    expect(specs.recommendations.database.cpuLimit).toBeTruthy();
    expect(specs.recommendations.database.memoryPresetOptions.length).toBeGreaterThan(0);
    expect(specs.recommendations.database.cpuPresetOptions.length).toBeGreaterThan(0);

    expect(specs.recommendations.cron.maxConcurrentJobs).toBeGreaterThanOrEqual(2);
    expect(specs.recommendations.cron.defaultTimeoutSeconds).toBe(60);
  });
});

describe("Cron Runner Service & Controllers", () => {
  it("CronRunnerService provides startScheduler, stopScheduler, and runJobById", () => {
    expect(typeof cronRunnerService.startScheduler).toBe("function");
    expect(typeof cronRunnerService.stopScheduler).toBe("function");
    expect(typeof cronRunnerService.runJobById).toBe("function");
  });

  it("cron controller handlers are defined as Fastify route handlers", () => {
    expect(typeof listCronJobsHandler).toBe("function");
    expect(typeof createCronJobHandler).toBe("function");
    expect(typeof getCronJobHandler).toBe("function");
    expect(typeof updateCronJobHandler).toBe("function");
    expect(typeof deleteCronJobHandler).toBe("function");
    expect(typeof triggerCronJobHandler).toBe("function");
    expect(typeof getCronJobLogsHandler).toBe("function");
    expect(typeof getServerCapacitySpecsHandler).toBe("function");
  });
});
