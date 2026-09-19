import { inspectContainer, getContainerRestartCount, getContainerLogs } from "../utils/docker";
import { isPm2Running, getPm2Logs } from "../utils/pm2";
import { config } from "../config/env";
import { logger } from "../utils/logger";

/** Ordered URLs: configured path first, then IPv4/IPv6 variants, and standard fallback paths. */
export function buildHealthCheckUrls(baseUrl: string, healthPath: string): string[] {
  const base = baseUrl.replace(/\/$/, "");
  const p = healthPath.startsWith("/") ? healthPath : `/${healthPath}`;

  const alternativeBases: string[] = [];
  if (base.includes("localhost")) {
    alternativeBases.push(base.replace("localhost", "127.0.0.1"));
  } else if (base.includes("127.0.0.1")) {
    alternativeBases.push(base.replace("127.0.0.1", "localhost"));
  }

  const allBases = [base, ...alternativeBases];
  const paths = [p, "/", "/api", "/api/health", "/healthz", "/status", "/api/status", "/index.html"];

  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const b of allBases) {
    for (const pathItem of paths) {
      const url = `${b}${pathItem === "/" && b.endsWith("/") ? "" : pathItem}`;
      if (!seen.has(url)) {
        seen.add(url);
        ordered.push(url);
      }
    }
  }

  return ordered;
}

export interface ValidationResult {
  success: boolean;
  latency: number;
  error?: string;
}

export class ValidationService {
  async validate(
    baseUrl: string,
    healthPath: string,
    containerName: string
  ): Promise<ValidationResult> {
    const urls = buildHealthCheckUrls(baseUrl, healthPath);
    const configuredUrl = urls[0];
    const { maxRetries, retryDelayMs, healthTimeoutMs, maxLatencyMs } = config.validation;

    logger.info({ healthUrl: configuredUrl, fallbacks: urls.slice(1), containerName }, "Starting validation");

    let running = true;
    try {
      running = await inspectContainer(containerName);
    } catch {
      running = false;
    }

    if (!running) {
      const pm2Online = await isPm2Running(containerName);
      if (pm2Online) {
        running = true;
      }
    }

    if (!running) {
      const containerLogs = await getContainerLogs(containerName, 30).catch(() => []);
      const pm2Raw = await getPm2Logs(containerName, 30).catch(() => "");
      const logs: string[] = containerLogs.length > 0 ? containerLogs : pm2Raw.split("\n").filter(Boolean);
      logger.error({ containerName, logs }, "Instance (container/pm2) is not running");
      return { success: false, latency: 0, error: this.formatError("Instance failed to start", logs) };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // After first attempt, check for crash loop — restart count > 0 means app keeps dying
      if (attempt > 1) {
        const restarts = await getContainerRestartCount(containerName);
        if (restarts > 0) {
          const logs = await getContainerLogs(containerName, 40);
          logger.error({ containerName, attempt, restarts, logs }, "Container is crash-looping");
          return { success: false, latency: 0, error: this.formatError(`App crashed (restarted ${restarts}x) — check your env vars and startup config`, logs) };
        }
      }

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const start = Date.now();
        try {
          const response = await fetch(url, {
            method: "GET",
            signal: AbortSignal.timeout(healthTimeoutMs),
          });
          const latency = Date.now() - start;

          // Accept 2xx, 3xx redirects, or 401/403 (service is alive and responding)
          if ((response.status >= 200 && response.status < 400) || response.status === 401 || response.status === 403) {
            if (i > 0) {
              logger.info(
                { url, configuredPath: healthPath, attempt, status: response.status, latency },
                "Validation passed via fallback URL; set project health path to match your app"
              );
            } else if (latency > maxLatencyMs) {
              logger.warn({ healthUrl: url, attempt, latency }, `Latency ${latency}ms exceeded threshold (still passing)`);
            } else {
              logger.debug({ healthUrl: url, attempt, latency }, "Validation passed");
            }
            return { success: true, latency };
          }
        } catch {
          // Continue trying next candidate url / fallback on this attempt
        }
      }

      if (attempt < maxRetries) {
        await this.sleep(retryDelayMs);
      }
    }

    const containerLogs = await getContainerLogs(containerName, 40).catch(() => []);
    const pm2Raw = await getPm2Logs(containerName, 40).catch(() => "");
    const logs: string[] = containerLogs.length > 0 ? containerLogs : pm2Raw.split("\n").filter(Boolean);
    const error = `Health check failed after ${maxRetries} attempts`;
    logger.error({ healthUrl: configuredUrl, containerName, logs }, error);
    return { success: false, latency: 0, error: this.formatError(error, logs) };
  }

  private formatError(reason: string, logs: string[]): string {
    if (logs.length === 0) return reason;
    // Strip ANSI colour codes and Docker timestamps for readability
    const clean = logs
      .map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").replace(/^\S+Z\s+/, ""))
      .filter((l) => l.trim().length > 0)
      .slice(-20);
    return `${reason}\n\n--- Container output ---\n${clean.join("\n")}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
