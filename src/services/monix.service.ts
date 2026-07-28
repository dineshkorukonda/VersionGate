import { engineHealthMonitor } from "./engine-monitor.service";
import { logger } from "../utils/logger";

export class MonixService {
  start(): void {
    logger.info("MonixService: starting native background engine health monitor");
    engineHealthMonitor.start();
  }

  stop(): void {
    logger.info("MonixService: stopping native background engine health monitor");
    engineHealthMonitor.stop();
  }
}
