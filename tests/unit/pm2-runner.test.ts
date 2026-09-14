import { describe, test, expect } from "bun:test";
import {
  isPm2Available,
  listPm2Processes,
  getPm2Process,
  isPm2Running,
  startPm2App,
  stopPm2App,
  deletePm2App,
  getPm2Logs,
} from "../../src/utils/pm2";

describe("Host PM2 Process Runner Utility", () => {
  test("isPm2Available returns boolean without throwing", async () => {
    const available = await isPm2Available();
    expect(typeof available).toBe("boolean");
  });

  test("listPm2Processes returns an array", async () => {
    const procs = await listPm2Processes();
    expect(Array.isArray(procs)).toBe(true);
  });

  test("getPm2Process returns null for non-existent process", async () => {
    const proc = await getPm2Process("non-existent-process-" + Date.now());
    expect(proc).toBeNull();
  });

  test("isPm2Running returns false for non-existent process", async () => {
    const running = await isPm2Running("non-existent-process-" + Date.now());
    expect(running).toBe(false);
  });

  test("stopPm2App and deletePm2App handle missing processes gracefully without throwing", async () => {
    await expect(stopPm2App("non-existent-process-" + Date.now())).resolves.toBeUndefined();
    await expect(deletePm2App("non-existent-process-" + Date.now())).resolves.toBeUndefined();
  });

  test("getPm2Logs returns empty string or logs without throwing", async () => {
    const logs = await getPm2Logs("non-existent-process-" + Date.now(), 10);
    expect(typeof logs).toBe("string");
  });
});
