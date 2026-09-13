import { describe, test, expect } from "bun:test";
import net from "net";
import {
  parseExcludedPorts,
  validateExcludedPortsString,
  isPortAvailableOnHost,
  isProjectPortRangeSafe,
  findNextAvailableBasePort,
  getProjectRequiredPorts,
} from "../../src/utils/port-manager";

describe("Port Manager Utility", () => {
  test("parseExcludedPorts parses individual ports and ranges correctly", () => {
    const raw = "80, 443, 3000; 5000-5003 8080";
    const ports = parseExcludedPorts(raw);

    expect(ports.has(80)).toBe(true);
    expect(ports.has(443)).toBe(true);
    expect(ports.has(3000)).toBe(true);
    expect(ports.has(5000)).toBe(true);
    expect(ports.has(5001)).toBe(true);
    expect(ports.has(5002)).toBe(true);
    expect(ports.has(5003)).toBe(true);
    expect(ports.has(5004)).toBe(false);
    expect(ports.has(8080)).toBe(true);
    expect(ports.has(9090)).toBe(false);
  });

  test("parseExcludedPorts handles reverse ranges and empty strings gracefully", () => {
    const empty = parseExcludedPorts("");
    expect(empty.size).toBe(0);

    const reversed = parseExcludedPorts("3005-3001");
    expect(reversed.has(3001)).toBe(true);
    expect(reversed.has(3005)).toBe(true);
    expect(reversed.size).toBe(5);
  });

  test("validateExcludedPortsString validates port lists and ranges", () => {
    expect(validateExcludedPortsString("80, 443, 3000, 8000-8050").valid).toBe(true);
    expect(validateExcludedPortsString("").valid).toBe(true);

    const invalidToken = validateExcludedPortsString("80, abc, 3000");
    expect(invalidToken.valid).toBe(false);
    expect(invalidToken.error).toContain("Invalid port token");

    const invalidRange = validateExcludedPortsString("8000-99999");
    expect(invalidRange.valid).toBe(false);
    expect(invalidRange.error).toContain("out of bounds");

    const hugeRange = validateExcludedPortsString("1000-10000");
    expect(hugeRange.valid).toBe(false);
    expect(hugeRange.error).toContain("too large");
  });

  test("getProjectRequiredPorts returns 6 blue/green slots across 3 environments", () => {
    const ports = getProjectRequiredPorts(3100);
    expect(ports).toEqual([3100, 3101, 3300, 3301, 3500, 3501]);
  });

  test("isPortAvailableOnHost detects free ports and busy ports", async () => {
    // 1. Pick a random high port
    const testPort = 48721;
    const initialCheck = await isPortAvailableOnHost(testPort);
    expect(initialCheck).toBe(true);

    // 2. Bind a temporary server to that port
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(testPort, "0.0.0.0", () => resolve()));

    try {
      const busyCheck = await isPortAvailableOnHost(testPort);
      expect(busyCheck).toBe(false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // 3. Once closed, should be available again
    const freedCheck = await isPortAvailableOnHost(testPort);
    expect(freedCheck).toBe(true);
  });

  test("isProjectPortRangeSafe identifies excluded ports and project collisions", async () => {
    const excluded = new Set([3300]); // Staging blue port of 3100
    const existingProjects = [4000];

    // Baseport 3100 needs 3300, which is excluded
    const check1 = await isProjectPortRangeSafe(3100, excluded, existingProjects, false);
    expect(check1.safe).toBe(false);
    expect(check1.conflictingPort).toBe(3300);

    // Baseport 4000 collides with existing project
    const check2 = await isProjectPortRangeSafe(4000, new Set(), existingProjects, false);
    expect(check2.safe).toBe(false);
    expect(check2.conflictingPort).toBe(4000);

    // Baseport 5000 is clean
    const check3 = await isProjectPortRangeSafe(5000, excluded, existingProjects, false);
    expect(check3.safe).toBe(true);
  });

  test("findNextAvailableBasePort automatically skips excluded ports to next clean block", async () => {
    // Exclude port 3300 (which is inside 3100 block) and 3801 (which is inside 3600 block)
    const excluded = new Set([3300, 3801]);
    const existing = [2000];

    const chosen = await findNextAvailableBasePort(3100, excluded, existing);
    // 3100 has 3300 excluded -> skips to 3600
    // 3600 has 3801 excluded -> skips to 4100
    expect(chosen).toBe(4100);
  });
});
