import axios from "axios";
import { logger } from "../utils/logger";

const HEALTH_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2_000;

export class ValidationService {
  /**
   * Performs a health check against the given container URL.
   * Retries up to MAX_RETRIES times before declaring failure.
   *
   * TODO: make retry count and timeout configurable via env.
   */
  async validate(containerUrl: string): Promise<boolean> {
    const healthUrl = `${containerUrl}/health`;
    logger.info({ healthUrl }, "Running health check");

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // TODO: replace stub with real HTTP check once containers are real
        const response = await axios.get(healthUrl, {
          timeout: HEALTH_TIMEOUT_MS,
        });

        if (response.status === 200) {
          logger.info({ healthUrl, attempt }, "Health check passed");
          return true;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn({ healthUrl, attempt, err: message }, "Health check attempt failed");

        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAY_MS);
        }
      }
    }

    logger.error({ healthUrl }, "Health check failed after all retries");
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
