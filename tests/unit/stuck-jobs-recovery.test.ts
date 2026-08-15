import { describe, test, expect } from "bun:test";
import { ReconciliationReport } from "../../src/services/reconciliation.service";

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
});
