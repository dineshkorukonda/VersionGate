import { inspectContainer, getContainerRestartCount, getContainerLogs } from "../utils/docker";
import { isPm2Running, getPm2Logs } from "../utils/pm2";
import { config } from "../config/env";
import { logger } from "../utils/logger";

/** Ordered URLs: configured path first, then common API health routes and dual IPv4/localhost bindings. */
export function buildHealthCheckUrls(baseUrl: string, healthPath: string): string[] {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const p = (healthPath || "/").trim();
  const normalizedPath = p.startsWith("/") ? p : `/${p}`;

  const bases: string[] = [cleanBase];
  try {
    const parsed = new URL(cleanBase);
    if (parsed.hostname === "localhost") {
      bases.push(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ""}`);
    } else if (parsed.hostname === "127.0.0.1") {
      bases.push(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ""}`);
    }
  } catch {
    // ignore parse error
  }

  const pathCandidates = [
    normalizedPath,
    "/",
    "/health",
    "/v1/health",
    "/api/health",
    "/api/v1/health",
    "/v2/health",
    "/api/v2/health",
    "/healthz",
    "/live",
    "/livez",
    "/ready",
    "/readyz",
    "/alive",
    "/ping",
    "/status",
    "/api/status",
    "/v1/status",
    "/api/v1/status",
    "/up",
    "/api",
    "/v1",
    "/api/v1",
    "/version",
    "/info",
    "/index.html",
  ];

  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const b of bases) {
    for (const cand of pathCandidates) {
      const fullUrl = `${b}${cand === "/" ? "/" : cand.startsWith("/") ? cand : `/${cand}`}`;
      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        ordered.push(fullUrl);
      }
    }
  }

  return ordered;
}

export interface ValidationResult {
  success: boolean;
  latency: number;
  detectedHealthPath?: string;
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

    logger.info({ healthUrl: configuredUrl, candidateCount: urls.length, containerName }, "Starting validation");

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

          // 2xx/3xx or 401/403/405 confirm the HTTP server is alive and responding on this port
          const isAlive = (response.status >= 200 && response.status < 400) ||
            response.status === 401 ||
            response.status === 403 ||
            response.status === 405;

          if (isAlive) {
            let detectedPath = healthPath;
            try {
              const parsed = new URL(url);
              detectedPath = parsed.pathname || "/";
            } catch {
              // ignore
            }

            if (i > 0) {
              logger.info(
                { url, configuredPath: healthPath, detectedPath, attempt, latency, status: response.status },
                "Validation passed via candidate health URL"
              );
            } else if (latency > maxLatencyMs) {
              logger.warn({ healthUrl: url, attempt, latency }, `Latency ${latency}ms exceeded threshold (still passing)`);
            } else {
              logger.debug({ healthUrl: url, attempt, latency }, "Validation passed");
            }
            return { success: true, latency, detectedHealthPath: detectedPath };
          }

          logger.debug({ healthUrl: url, attempt, status: response.status }, "Candidate health URL returned non-live status");
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.debug({ healthUrl: url, attempt, err: message }, "Candidate health check probe failed");
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
