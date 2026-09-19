import { describe, test, expect } from "bun:test";
import { GitService } from "../../src/services/git.service";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Monorepo Subfolder Resolution & Manifest Verification", () => {
  const gitService = new GitService();

  test("resolveEffectiveBuildContext automatically finds monorepo subfolder from project name", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-monorepo-test-"));
    const projectDir = path.join(tmpDir, "test-proj-id");
    const subfolder = path.join(projectDir, "core-api");

    await fs.mkdir(subfolder, { recursive: true });
    await fs.writeFile(path.join(subfolder, "package.json"), JSON.stringify({ name: "core-api", version: "1.0.0" }));

    const project = {
      id: "test-proj-id",
      name: "carf-core-api",
      buildContext: ".",
    };

    // Override projectPath calculation for test
    const origPath = gitService.projectPath;
    (gitService as any).projectPath = () => projectDir;
    (gitService as any).buildContextPath = () => projectDir;

    const resolved = await gitService.resolveEffectiveBuildContext(project as any);
    expect(resolved).toBe(subfolder);

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });
    gitService.projectPath = origPath;
  });

  test("resolveEffectiveBuildContext finds nested apps/* subfolder", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-nested-test-"));
    const projectDir = path.join(tmpDir, "nested-proj-id");
    const subfolder = path.join(projectDir, "apps", "dashboard");

    await fs.mkdir(subfolder, { recursive: true });
    await fs.writeFile(path.join(subfolder, "package.json"), JSON.stringify({ name: "dashboard", version: "1.0.0" }));

    const project = {
      id: "nested-proj-id",
      name: "carf-dashboard",
      buildContext: ".",
    };

    const origPath = gitService.projectPath;
    (gitService as any).projectPath = () => projectDir;
    (gitService as any).buildContextPath = () => projectDir;

    const resolved = await gitService.resolveEffectiveBuildContext(project as any);
    expect(resolved).toBe(subfolder);

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });
    gitService.projectPath = origPath;
  });

  test("resolveEffectiveBuildContext finds subfolder matching adopted localPath", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-localpath-test-"));
    const projectDir = path.join(tmpDir, "adopted-proj-id");
    const subfolder = path.join(projectDir, "apps", "carf-dashboard");

    await fs.mkdir(subfolder, { recursive: true });
    await fs.writeFile(path.join(subfolder, "package.json"), JSON.stringify({ name: "carf-dashboard", version: "1.0.0" }));

    const project = {
      id: "adopted-proj-id",
      name: "custom-dashboard-name",
      localPath: "/var/www/my-repo/apps/carf-dashboard",
      buildContext: ".",
    };

    const origPath = gitService.projectPath;
    (gitService as any).projectPath = () => projectDir;
    (gitService as any).buildContextPath = () => projectDir;

    const resolved = await gitService.resolveEffectiveBuildContext(project as any);
    expect(resolved).toBe(subfolder);

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });
    gitService.projectPath = origPath;
  });
});
