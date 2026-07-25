import fs from "fs/promises";
import { execFileAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { DeploymentError } from "../utils/errors";
import { NginxUpstreamService } from "./nginx-upstream.service";
import { writeNginxConfigFile } from "../utils/nginx-writer";

export interface TrafficSwitchOptions {
  projectName?: string;
  environmentName?: string;
}

export class TrafficService {
  private readonly upstreamService = new NginxUpstreamService();

  /**
   * Updates the Nginx upstream config to point at the given port, then
   * reloads Nginx. Backs up the existing config before overwriting and
   * restores it automatically if nginx -s reload fails.
   */
  async switchTrafficTo(port: number, options?: TrafficSwitchOptions): Promise<void> {
    const configPath = config.nginxConfigPath;
    const backupPath = `${configPath}.bak`;

    logger.info({ port, configPath, options }, "Switching Nginx traffic");

    const newContent = this.upstreamService.buildNginxUpstreamConfig({
      port,
      projectName: options?.projectName,
      environmentName: options?.environmentName,
    });

    // Backup existing config if it exists
    let hasBackup = false;
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      await writeNginxConfigFile(backupPath, existing);
      hasBackup = true;
      logger.debug({ backupPath }, "Nginx config backed up");
    } catch {
      // No existing config to back up — first run
    }

    // Write new config (uses /tmp staging + sudo cp fallback if EACCES occurs)
    await writeNginxConfigFile(configPath, newContent);

    // Reload Nginx; restore backup on failure.
    try {
      await this.reloadNginx();
      logger.info({ port }, "Nginx reloaded — traffic switched");
    } catch (err) {
      logger.error({ err }, "Nginx reload failed — restoring backup");

      if (hasBackup) {
        try {
          const backupContent = await fs.readFile(backupPath, "utf-8");
          await writeNginxConfigFile(configPath, backupContent);
          logger.info({ backupPath }, "Nginx config restored from backup");
        } catch (restoreErr) {
          logger.error({ restoreErr }, "Failed to restore Nginx backup");
        }
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new DeploymentError(`Nginx reload failed: ${message}`);
    }
  }

  private async reloadNginx(): Promise<void> {
    try {
      await execFileAsync("nginx", ["-s", "reload"]);
      return;
    } catch (directErr) {
      logger.debug({ err: directErr }, "nginx reload as current user failed — trying sudo -n");
    }
    await execFileAsync("sudo", ["-n", "/usr/sbin/nginx", "-s", "reload"]);
  }
}

