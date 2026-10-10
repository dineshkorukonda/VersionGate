import { copyFileSync, existsSync, readFileSync, writeFileSync, renameSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import { envFilePath } from "./paths";

export function escapeEnvValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"');
}

/**
 * Merges KEY=value pairs into the project `.env` file, replacing existing keys or appending new lines.
 */
export function mergeIntoDotenv(updates: Record<string, string>): string {
  return mergeDotenvContent(existsSync(envFilePath) ? readFileSync(envFilePath, "utf-8") : "", updates);
}

export function mergeDotenvContent(content: string, updates: Record<string, string>): string {
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${escapeEnvValue(value)}"`;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^${escapedKey}\\s*=\\s*.*$`, "m");
    if (re.test(content)) {
      content = content.replace(re, () => line);
    } else {
      if (content.length > 0 && !content.endsWith("\n")) {
        content += "\n";
      }
      content += `${line}\n`;
    }
  }
  return content;
}

/** Publish a complete private configuration file without exposing partial writes. */
export function writeEnvAtomically(path: string, content: string | Buffer): void {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, content, { mode: 0o600 });
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

export function writeEnvWithBackup(newContent: string): void {
  if (existsSync(envFilePath)) {
    copyFileSync(envFilePath, `${envFilePath}.bak`);
  }
  writeFileSync(envFilePath, newContent, "utf-8");
}
