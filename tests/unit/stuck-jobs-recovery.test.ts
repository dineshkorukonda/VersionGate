import { describe, test, expect, spyOn } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import * as client from "../../src/db/client";
import { ReconciliationReport } from "../../src/services/reconciliation.service";
import { MAX_JOB_LOG_LINES, STALE_RUNNING_JOB_MS, recoverStuckJobs, heartbeatJob, assertJobLease, WORKER_OWNER } from "../../src/services/job-queue.service";

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

  test("recovery only fails expired leases and does not requeue live work", async () => {
    let condition: any;
    let changes: any;
    const db = { update: () => ({ set: (value: any) => {
      changes = value;
      return { where: (value: any) => { condition = value; return { returning: async () => [{ id: "expired" }] }; } };
    } }) };
    const mock = spyOn(client, "getDb").mockReturnValue(db as any);
    try {
      expect(await recoverStuckJobs()).toBe(1);
      const query = new PgDialect().sqlToQuery(condition);
      expect(query.sql).toContain('"Job"."leaseExpiresAt" <');
      expect(query.sql).toContain('"Job"."leaseExpiresAt" is null');
      expect(changes.status).toBe("FAILED");
      expect(changes).not.toHaveProperty("startedAt");
    } finally { mock.mockRestore(); }
  });

  test("heartbeats require the current worker and an unexpired running lease", async () => {
    let condition: any;
    const db = { update: () => ({ set: () => ({ where: (value: any) => {
      condition = value;
      return { returning: async () => [] };
    } }) }) };
    const mock = spyOn(client, "getDb").mockReturnValue(db as any);
    try {
      expect(await heartbeatJob("owned-job")).toBe(false);
      await expect(assertJobLease("owned-job")).rejects.toThrow("ownership lost");
      const query = new PgDialect().sqlToQuery(condition);
      expect(query.params).toContain(WORKER_OWNER);
      expect(query.params).toContain("RUNNING");
      expect(query.sql).toContain('"Job"."leaseExpiresAt" >= NOW()');
    } finally { mock.mockRestore(); }
  });
});
