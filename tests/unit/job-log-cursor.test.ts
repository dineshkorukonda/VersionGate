import { describe, expect, test } from "bun:test";
import { jobLogsAfter } from "../../src/utils/job-log-cursor";

describe("retained job log cursor", () => {
  test("continues beyond 5000 entries without duplicating older lines", () => {
    const before = Array.from({ length: 5000 }, (_, i) => `line ${i + 1}`);
    const initial = jobLogsAfter({ logs: before, logSequence: 5000 }, 0);
    const next = jobLogsAfter({ logs: [...before.slice(1), "line 5001"], logSequence: 5001 }, initial.cursor);
    expect(next.entries).toEqual([{ line: "line 5001", sequence: 5001 }]);
    expect(next.gap).toBe(false);
    expect(jobLogsAfter({ logs: before, logSequence: 5000 }, initial.cursor).entries).toEqual([]);
  });

  test("handles legacy rows and identifies retention gaps", () => {
    expect(jobLogsAfter({ logs: ["legacy"], logSequence: 0 }, 0).cursor).toBe(1);
    const batch = jobLogsAfter({ logs: ["new 9", "new 10"], logSequence: 10 }, 3);
    expect(batch.gap).toBe(true);
    expect(batch.entries.map((entry) => entry.sequence)).toEqual([9, 10]);
  });
});
