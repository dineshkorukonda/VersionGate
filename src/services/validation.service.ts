import axios from "axios";
import { inspectContainer, getContainerRestartCount, getContainerLogs } from "../utils/docker";
import { config } from "../config/env";
import { logger } from "../utils/logger";

/** Ordered URLs: configured path first, then / and /index.html when the app has no dedicated health route (e.g. static nginx). */
function buildHealthCheckUrls(baseUrl: string, healthPath: string): string[] {
  const base = baseUrl.replace(/\/$/, "");
  const p = healthPath.startsWith("/") ? healthPath : `/${healthPath}`;
  const primary = `${base}${p}`;
  const extras: string[] = [];
  if (p !== "/") extras.push(`${base}/`);
  if (p !== "/index.html") extras.push(`${base}/index.html`);
  const seen = new Set<string>([primary]);
  const ordered = [primary];
  for (const u of extras) {
    if (!seen.has(u)) {
      seen.add(u);
      ordered.push(u);
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
    } catch (err) {
      logger.warn(
        { err, containerName },
        "Docker inspect failed during validation — continuing with HTTP health checks"
      );
    }
    if (!running) {
      const logs = await getContainerLogs(containerName, 30);
      logger.error({ containerName, logs }, "Container is not running");
      return { success: false, latency: 0, error: this.formatError("Container failed to start", logs) };
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

      let primaryProbeFailed = false;
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const start = Date.now();
        try {
          const response = await axios.get(url, {
            timeout: healthTimeoutMs,
            validateStatus: () => true,
          });
          const latency = Date.now() - start;

          if (response.status >= 200 && response.status < 300) {
            if (i > 0) {
              logger.info(
                { url, configuredPath: healthPath, attempt, latency },
                "Validation passed via fallback URL; set project health path to match your app (e.g. / for static/nginx)"
              );
            } else if (latency > maxLatencyMs) {
              logger.warn({ healthUrl: url, attempt, latency }, `Latency ${latency}ms exceeded threshold (still passing)`);
            } else {
              logger.debug({ healthUrl: url, attempt, latency }, "Validation passed");
            }
            return { success: true, latency };
          }

          if (i === 0) {
            const missingRoute = response.status === 404 || response.status === 405;
            if (missingRoute && urls.length > 1) {
              logger.warn(
                { healthUrl: url, attempt, status: response.status },
                "Primary health path missing — trying / and /index.html"
              );
            } else {
              logger.warn(
                { healthUrl: url, attempt, status: response.status },
                response.status === 404
                  ? "Health URL returned 404 — add this route in your app or set health path to an existing URL (e.g. /)"
                  : "Health URL returned non-2xx status"
              );
              if (!missingRoute) break;
            }
          } else {
            logger.debug({ healthUrl: url, attempt, status: response.status }, "Fallback URL not OK");
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (i === 0) {
            logger.warn({ healthUrl: url, attempt, err: message }, "Validation attempt failed");
            primaryProbeFailed = true;
          } else {
            logger.debug({ healthUrl: url, attempt, err: message }, "Fallback validation attempt failed");
          }
        }
        if (primaryProbeFailed) break;
      }

      if (attempt < maxRetries) {
        await this.sleep(retryDelayMs);
      }
    }

    const logs = await getContainerLogs(containerName, 40);
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
