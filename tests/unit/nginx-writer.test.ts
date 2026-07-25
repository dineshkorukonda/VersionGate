import { describe, test, expect } from "bun:test";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { writeNginxConfigFile } from "../../src/utils/nginx-writer";

describe("writeNginxConfigFile", () => {
  test("writes file content directly when directory is writable", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vg-nginx-test-"));
    const targetFile = path.join(tmpDir, "upstream.conf");

    try {
      await writeNginxConfigFile(targetFile, "upstream test { server 127.0.0.1:8000; }\n");
      const content = await fs.readFile(targetFile, "utf-8");
      expect(content).toContain("server 127.0.0.1:8000;");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
