import { describe, test, expect } from "bun:test";
import { ensureDockerfile, tryGenerateDockerfile } from "../../src/utils/dockerfile";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Extended Framework & Custom Dockerfile Generator", () => {
  test("generates custom Dockerfile with explicit install, build, and start commands", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-custom-"));
    try {
      const buildDir = await ensureDockerfile(tmpDir, 4000, undefined, {
        packageManager: "pnpm",
        installCommand: "pnpm install --frozen-lockfile",
        buildCommand: "pnpm run build",
        startCommand: "pnpm start",
      });
      expect(buildDir).toBe(tmpDir);

      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM node:20-alpine");
      expect(content).toContain("RUN npm install -g pnpm");
      expect(content).toContain("RUN pnpm install --frozen-lockfile");
      expect(content).toContain("RUN pnpm run build");
      expect(content).toContain("EXPOSE 4000");
      expect(content).toContain('CMD ["sh", "-c", "pnpm start"]');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Python uv project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-uv-"));
    try {
      await fs.writeFile(path.join(tmpDir, "pyproject.toml"), '[project]\nname = "demo"\n[tool.uv]', "utf-8");
      await fs.writeFile(path.join(tmpDir, "uv.lock"), "", "utf-8");

      await ensureDockerfile(tmpDir, 8000);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("ghcr.io/astral-sh/uv:latest");
      expect(content).toContain("uv sync --frozen");
      expect(content).toContain('CMD ["uv", "run", "python", "app.py"]');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Python Poetry project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-poetry-"));
    try {
      await fs.writeFile(path.join(tmpDir, "poetry.lock"), "", "utf-8");

      await ensureDockerfile(tmpDir, 8000);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("pip install --no-cache-dir poetry");
      expect(content).toContain("poetry install");
      expect(content).toContain('CMD ["poetry", "run", "python", "app.py"]');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Python Pipenv project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-pipenv-"));
    try {
      await fs.writeFile(path.join(tmpDir, "Pipfile"), "[packages]\nrequests = '*'", "utf-8");

      await ensureDockerfile(tmpDir, 8000);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("pip install --no-cache-dir pipenv");
      expect(content).toContain("pipenv install");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates multi-stage Dockerfile for Rust Cargo project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-rust-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "Cargo.toml"),
        '[package]\nname = "testrust"\nversion = "0.1.0"\nedition = "2021"',
        "utf-8"
      );

      await ensureDockerfile(tmpDir, 8080);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM rust:1-alpine AS builder");
      expect(content).toContain("RUN cargo build --release");
      expect(content).toContain("FROM alpine:latest");
      expect(content).toContain("EXPOSE 8080");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for PHP composer project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-php-"));
    try {
      await fs.writeFile(path.join(tmpDir, "composer.json"), '{"name": "test/app"}', "utf-8");

      await ensureDockerfile(tmpDir, 8080);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM php:8.3-cli-alpine");
      expect(content).toContain("composer install");
      expect(content).toContain("EXPOSE 8080");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("respects explicit packageManager override", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-override-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "app", scripts: { start: "node index.js" } }),
        "utf-8"
      );

      await ensureDockerfile(tmpDir, 3000, undefined, { packageManager: "bun" });
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM oven/bun:alpine");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
