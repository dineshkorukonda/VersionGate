import { autoDeployPollMsLive } from "../config/env";
import { logger } from "../utils/logger";
import { statusOverviewService } from "./status-overview.service";

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let isPollRunning = false;
let activePollMs: number | null = null;

async function runAutoDeployTick(): Promise<void> {
  if (isPollRunning) {
    logger.debug("Auto-deploy poll: previous check still running — skipping tick");
    scheduleNextTick();
    return;
  }

  isPollRunning = true;
  try {
    const result = await statusOverviewService.checkAndSyncAutoDeploy({ forceDeploy: false });
    if (result.triggeredCount > 0) {
      logger.info(
        { checked: result.checkedCount, triggered: result.triggeredCount },
        "Auto-deploy poll: enqueued deployment jobs for detected commits"
      );
    }
  } catch (err) {
    logger.warn({ err }, "Auto-deploy poll: error during checkAndSyncAutoDeploy");
  } finally {
    isPollRunning = false;
    scheduleNextTick();
  }
}

function scheduleNextTick(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  const ms = activePollMs ?? autoDeployPollMsLive();
  if (ms <= 0) return;

  pollTimer = setTimeout(() => {
    void runAutoDeployTick();
  }, ms);
}

export function startAutoDeployPoll(customMs?: number): void {
  stopAutoDeployPoll();
  if (customMs !== undefined) {
    activePollMs = customMs;
  } else {
    activePollMs = null;
  }

  const ms = activePollMs ?? autoDeployPollMsLive();
  if (ms <= 0) {
    logger.info("Auto-deploy background poller disabled (interval <= 0)");
    return;
  }

  logger.info({ intervalMs: ms }, "Auto-deploy background poller engine started");
  scheduleNextTick();
}

export function stopAutoDeployPoll(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  activePollMs = null;
  isPollRunning = false;
  logger.debug("Auto-deploy background poller stopped");
}

export function kickAutoDeployPoll(): void {
  stopAutoDeployPoll();
  startAutoDeployPoll();
}

export function isAutoDeployPollActive(): boolean {
  return pollTimer !== null;
}
