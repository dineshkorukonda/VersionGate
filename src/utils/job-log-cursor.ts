/** Select retained log entries using the total append count, not the array length. */
export function jobLogsAfter(job: { logs: unknown; logSequence: number }, after: number): {
  cursor: number;
  gap: boolean;
  entries: Array<{ line: string; sequence: number }>;
} {
  const logs = Array.isArray(job.logs) ? job.logs as string[] : [];
  // Existing rows start at zero when the sequence column is added.
  const cursor = Math.max(job.logSequence, logs.length);
  const first = cursor - logs.length + 1;
  return {
    cursor,
    gap: after > 0 && after < first - 1,
    entries: logs.flatMap((line, i) => first + i > after ? [{ line, sequence: first + i }] : []),
  };
}
