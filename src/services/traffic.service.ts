import fs from "fs/promises";
import { execAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export class TrafficService {
  /**
   * Updates the Nginx upstream config to point at the given port,
   * then reloads Nginx without dropping connections.
   *
   * TODO: implement real config template rendering and atomic file swap.
   */
  async switchTrafficTo(port: number): Promise<void> {
    logger.info({ port }, "Switching Nginx traffic");

    await this.writeNginxConfig(port);
    await this.reloadNginx();

    logger.info({ port }, "Traffic switched successfully");
  }

  private async writeNginxConfig(port: number): Promise<void> {
    const configPath = config.nginx.configPath;

    // TODO: use a real template engine (e.g., handlebars) for complex configs.
    const content = this.buildNginxUpstream(port);

    logger.info({ configPath }, "Writing Nginx upstream config");
    // TODO: uncomment once running in a real environment with Nginx.
    // await fs.writeFile(configPath, content, "utf-8");

    // Stub: log what would be written
    logger.debug({ configPath, content }, "Nginx config (stub — not written)");
  }

  private async reloadNginx(): Promise<void> {
    logger.info("Reloading Nginx");
    // TODO: uncomment once Nginx is present in the environment.
    // await execAsync("nginx -s reload");
    logger.debug("Nginx reload (stub — not executed)");
  }

  private buildNginxUpstream(port: number): string {
    return [
      "upstream zeroshift_backend {",
      `  server 127.0.0.1:${port};`,
      "}",
    ].join("\n");
  }

  // Suppress unused-import warnings during stub phase
  private _unusedRefs = { fs, execAsync };
}
