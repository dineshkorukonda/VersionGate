import net from "net";
import { logger } from "./logger";

export const DEFAULT_EXCLUDED_PORTS = "80,443,3000,5173,5432,6379,9090";

/**
 * Parses comma-separated ports and port ranges (e.g. "80, 443, 3000, 8000-8050, 9090").
 * Returns a Set of all numeric ports.
 */
export function parseExcludedPorts(raw: string | undefined): Set<number> {
  const result = new Set<number>();
  if (!raw || typeof raw !== "string") return result;

  const tokens = raw.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
  for (const token of tokens) {
    if (token.includes("-")) {
      const parts = token.split("-").map((p) => p.trim());
      if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(65535, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          result.add(p);
        }
      }
    } else if (/^\d+$/.test(token)) {
      const port = parseInt(token, 10);
      if (port >= 1 && port <= 65535) {
        result.add(port);
      }
    }
  }

  return result;
}

/**
 * Validates a user-provided string of excluded ports and ranges.
 */
export function validateExcludedPortsString(raw: string): { valid: boolean; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true };

  const tokens = trimmed.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
  for (const token of tokens) {
    if (token.includes("-")) {
      const parts = token.split("-").map((p) => p.trim());
      if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
        return {
          valid: false,
          error: `Invalid port range: "${token}". Use format "START-END" (e.g. "8000-8050").`,
        };
      }
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (start < 1 || start > 65535 || end < 1 || end > 65535) {
        return {
          valid: false,
          error: `Port range "${token}" out of bounds. Ports must be between 1 and 65535.`,
        };
      }
      if (Math.abs(end - start) > 5000) {
        return {
          valid: false,
          error: `Port range "${token}" is too large. Maximum 5,000 ports per range.`,
        };
      }
    } else if (!/^\d+$/.test(token)) {
      return {
        valid: false,
        error: `Invalid port token: "${token}". Expected numeric port or range.`,
      };
    } else {
      const p = parseInt(token, 10);
      if (p < 1 || p > 65535) {
        return {
          valid: false,
          error: `Port ${p} is out of bounds (allowed: 1-65535).`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Checks if a TCP port is currently free to bind on the host.
 */
export async function isPortAvailableOnHost(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once("error", () => {
      // EADDRINUSE or EACCES means port is busy or restricted
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    try {
      server.listen(port, "0.0.0.0");
    } catch {
      resolve(false);
    }
  });
}

/**
 * Returns the 6 ports reserved for a project's Blue/Green slots across:
 * - Production: [basePort, basePort + 1]
 * - Staging: [basePort + 200, basePort + 201]
 * - Development: [basePort + 400, basePort + 401]
 */
export function getProjectRequiredPorts(basePort: number): number[] {
  return [
    basePort,
    basePort + 1,
    basePort + 200,
    basePort + 201,
    basePort + 400,
    basePort + 401,
  ];
}

export interface PortSafetyCheck {
  safe: boolean;
  conflictingPort?: number;
  reason?: string;
}

/**
 * Verifies if a basePort range is safe from:
 * 1. Configured excluded ports.
 * 2. Active host listeners.
 * 3. Collisions with existing project basePort allocations.
 */
export async function isProjectPortRangeSafe(
  basePort: number,
  excluded: Set<number>,
  existingBasePorts: number[] = [],
  checkHostListeners = true,
  ignoreSelfBasePort?: number
): Promise<PortSafetyCheck> {
  const needed = getProjectRequiredPorts(basePort);

  // 1. Check range limits
  for (const p of needed) {
    if (p < 1024 || p > 65534) {
      return {
        safe: false,
        conflictingPort: p,
        reason: `Port ${p} is out of allowed user range (1024-65534)`,
      };
    }
  }

  // 2. Check excluded list
  for (const p of needed) {
    if (excluded.has(p)) {
      return {
        safe: false,
        conflictingPort: p,
        reason: `Port ${p} is in the reserved/excluded ports list`,
      };
    }
  }

  // 3. Check existing project allocations
  const existingSet = new Set<number>();
  for (const ep of existingBasePorts) {
    if (ignoreSelfBasePort === undefined || ep !== ignoreSelfBasePort) {
      for (const p of getProjectRequiredPorts(ep)) {
        existingSet.add(p);
      }
    }
  }

  for (const p of needed) {
    if (existingSet.has(p)) {
      return {
        safe: false,
        conflictingPort: p,
        reason: `Port ${p} collides with an existing project deployment slot`,
      };
    }
  }

  // 4. Check active host listeners
  if (checkHostListeners) {
    for (const p of needed) {
      const free = await isPortAvailableOnHost(p);
      if (!free) {
        return {
          safe: false,
          conflictingPort: p,
          reason: `Port ${p} is currently bound and listening on the host system`,
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Automatically finds the next available, conflict-free basePort.
 * Scans candidate blocks until all 6 required ports are unexcluded and free on the host.
 */
export async function findNextAvailableBasePort(
  startPort = 3100,
  excluded: Set<number>,
  existingBasePorts: number[] = []
): Promise<number> {
  const existingMax = existingBasePorts.length > 0 ? Math.max(...existingBasePorts) : 0;
  let candidate = Math.max(startPort, existingMax > 0 ? existingMax + 500 : startPort);

  // Maximum scan attempts to prevent infinite loop
  const maxCandidate = 64500;
  const attempts = 100;

  for (let i = 0; i < attempts; i++) {
    if (candidate > maxCandidate) {
      candidate = startPort;
    }

    const check = await isProjectPortRangeSafe(candidate, excluded, existingBasePorts, true);
    if (check.safe) {
      logger.debug({ candidate, attempt: i }, "findNextAvailableBasePort: selected safe basePort");
      return candidate;
    }

    logger.debug(
      { candidate, conflict: check.conflictingPort, reason: check.reason },
      "findNextAvailableBasePort: port range busy or excluded, trying next slot"
    );

    candidate += 500;
  }

  // Fallback if all attempts had conflicts
  logger.warn({ candidate }, "findNextAvailableBasePort: scan reached attempt limit, using current candidate");
  return candidate;
}
