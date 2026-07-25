import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFileAsync } from "./exec";
import { logger } from "./logger";
import { DeploymentError } from "./errors";

/**
 * Safely writes Nginx configuration content to a target file path.
 * 
 * To prevent EACCES permission denied errors when the Node/Bun process runs as a non-root user:
 * 1. Writes content to a temp file in /tmp.
 * 2. Tries direct copy to target file.
 * 3. Fallbacks to `sudo -n cp /tmp/... targetFile` if direct copy fails due to permissions.
 */
export async function writeNginxConfigFile(targetPath: string, content: string): Promise<void> {
  const tmpDir = os.tmpdir();
  const tmpFileName = `versiongate-nginx-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  const tmpPath = path.join(tmpDir, tmpFileName);

  await fs.writeFile(tmpPath, content, "utf-8");

  try {
    // 1. Direct copy attempt
    await fs.copyFile(tmpPath, targetPath);
    await fs.unlink(tmpPath).catch(() => null);
    return;
  } catch (err) {
    logger.debug({ err, targetPath }, "Direct Nginx config write failed — trying sudo cp");
  }

  // 2. Sudo fallback for non-root processes
  try {
    await execFileAsync("sudo", ["-n", "cp", tmpPath, targetPath]);
    await fs.unlink(tmpPath).catch(() => null);
  } catch (sudoErr) {
    await fs.unlink(tmpPath).catch(() => null);
    const msg = sudoErr instanceof Error ? sudoErr.message : String(sudoErr);
    throw new DeploymentError(
      `Permission denied writing Nginx config to ${targetPath}. Ensure current user has write access to /etc/nginx/conf.d or passwordless sudo cp access: ${msg}`
    );
  }
}
