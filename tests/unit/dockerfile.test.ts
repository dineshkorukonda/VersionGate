import { describe, test, expect } from "bun:test";
import { ensureDockerfile } from "../../src/utils/dockerfile";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Dockerfile Generator", () => {
  test("generates Dockerfile for Node.js package.json project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-node-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test-node-app", scripts: { start: "node index.js" } }),
        "utf-8"
      );

      const buildDir = await ensureDockerfile(tmpDir, 3000);
      expect(buildDir).toBe(tmpDir);

      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM node:20-alpine");
      expect(content).toContain("EXPOSE 3000");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Python requirements.txt project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-py-"));
    try {
      await fs.writeFile(path.join(tmpDir, "requirements.txt"), "flask==3.0.0", "utf-8");

      await ensureDockerfile(tmpDir, 8000);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM python:3.11-slim");
      expect(content).toContain("EXPOSE 8000");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Go go.mod project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-go-"));
    try {
      await fs.writeFile(path.join(tmpDir, "go.mod"), "module testgo\n\ngo 1.22", "utf-8");

      await ensureDockerfile(tmpDir, 8080);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM golang:1.22-alpine");
      expect(content).toContain("EXPOSE 8080");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("generates Dockerfile for Static index.html project", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-test-static-"));
    try {
      await fs.writeFile(path.join(tmpDir, "index.html"), "<h1>Hello</h1>", "utf-8");

      await ensureDockerfile(tmpDir, 80);
      const content = await fs.readFile(path.join(tmpDir, "Dockerfile"), "utf-8");
      expect(content).toContain("FROM nginx:1.25-alpine");
      expect(content).toContain("EXPOSE 80");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
