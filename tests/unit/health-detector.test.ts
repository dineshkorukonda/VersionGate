import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { detectHealthPathFromDir } from "../../src/utils/health-detector";

describe("Health check route detector", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-health-test-"));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
  });

  test("detects Express/Fastify /health endpoint", async () => {
    const testSubdir = path.join(tmpDir, "node-app");
    await fs.mkdir(testSubdir, { recursive: true });
    await fs.writeFile(
      path.join(testSubdir, "server.ts"),
      `import fastify from "fastify";
const app = fastify();
app.get("/health", async () => ({ status: "ok" }));
app.listen({ port: 3000 });`
    );

    const detected = await detectHealthPathFromDir(testSubdir);
    expect(detected).toBe("/health");
  });

  test("detects Python FastAPI /api/health endpoint", async () => {
    const testSubdir = path.join(tmpDir, "python-app");
    await fs.mkdir(testSubdir, { recursive: true });
    await fs.writeFile(
      path.join(testSubdir, "main.py"),
      `from fastapi import FastAPI
app = FastAPI()
@app.get("/api/health")
def health():
    return {"status": "ok"}`
    );

    const detected = await detectHealthPathFromDir(testSubdir);
    expect(detected).toBe("/api/health");
  });

  test("detects Go Gin /ping endpoint", async () => {
    const testSubdir = path.join(tmpDir, "go-app");
    await fs.mkdir(testSubdir, { recursive: true });
    await fs.writeFile(
      path.join(testSubdir, "main.go"),
      `package main
import "github.com/gin-gonic/gin"
func main() {
    r := gin.Default()
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "pong"})
    })
    r.Run()
}`
    );

    const detected = await detectHealthPathFromDir(testSubdir);
    expect(detected).toBe("/ping");
  });

  test("returns undefined for empty directories or non-existent folders", async () => {
    const emptySubdir = path.join(tmpDir, "empty-app");
    await fs.mkdir(emptySubdir, { recursive: true });
    const detected = await detectHealthPathFromDir(emptySubdir);
    expect(detected).toBeUndefined();

    const nonExistent = path.join(tmpDir, "does-not-exist");
    const detectedNone = await detectHealthPathFromDir(nonExistent);
    expect(detectedNone).toBeUndefined();
  });
});
