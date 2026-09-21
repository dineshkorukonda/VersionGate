import { describe, test, expect } from "bun:test";
import { ReconciliationReport } from "../../src/services/reconciliation.service";
import { MAX_JOB_LOG_LINES, STALE_RUNNING_JOB_MS } from "../../src/services/job-queue.service";

describe("Stuck Jobs Recovery & Reconciliation", () => {
  test("ReconciliationReport structure includes stuckJobsRecovered and staleLocksCleared", () => {
    const report: ReconciliationReport = {
      deployingFixed: 1,
      staleLocksCleared: 2,
      stuckJobsRecovered: 3,
      activeInvalidated: 0,
    };

    expect(report.deployingFixed).toBe(1);
    expect(report.staleLocksCleared).toBe(2);
    expect(report.stuckJobsRecovered).toBe(3);
    expect(report.activeInvalidated).toBe(0);
  });

  test("job log retention and stale runtime constants are defined", () => {
    expect(MAX_JOB_LOG_LINES).toBeGreaterThan(1000);
    expect(STALE_RUNNING_JOB_MS).toBeGreaterThan(60_000);
  });
});
