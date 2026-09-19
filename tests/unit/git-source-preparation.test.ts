import { describe, test, expect } from "bun:test";
import { GitService } from "../../src/services/git.service";
import { execFileAsync } from "../../src/utils/exec";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("GitService Source Preparation & Clean Destination Handling", () => {
  const gitService = new GitService();

  test("cloneRepo cleans non-empty destination directory before invoking clone", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-git-test-"));
    const targetProjectDir = path.join(tmpDir, "test-project-123");
    await fs.mkdir(targetProjectDir, { recursive: true });
    await fs.writeFile(path.join(targetProjectDir, "stale-file.txt"), "some dirty content");
    expect(await fs.exists(path.join(targetProjectDir, "stale-file.txt"))).toBe(true);

    const project = {
      id: "test-project-123",
      repoUrl: "https://127.0.0.1:1/dummy.git",
      branch: "main",
      localPath: null,
    };

    const gitAny = gitService as any;

    try {
      await gitAny.cloneRepo(project as any, targetProjectDir, "main");
    } catch {
      // Expected to fail on git clone after wiping dirty directory
    }

    // stale-file.txt should be completely wiped by the clean destination step
    const staleFileExists = await fs.exists(path.join(targetProjectDir, "stale-file.txt"));
    expect(staleFileExists).toBe(false);

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });
  }, 15000);

  test("buildContextPath correctly validates monorepo subdirectories", () => {
    const project = {
      id: "carf-core-api",
      buildContext: "apps/core-api",
    };

    const resolved = gitService.buildContextPath(project as any);
    expect(resolved.endsWith(path.join("carf-core-api", "apps", "core-api"))).toBe(true);

    // Should reject directory traversal outside repository
    expect(() => {
      gitService.buildContextPath({
        id: "carf-core-api",
        buildContext: "../../etc/passwd",
      } as any);
    }).toThrow("buildContext must stay inside the project repository directory.");
  });
});
