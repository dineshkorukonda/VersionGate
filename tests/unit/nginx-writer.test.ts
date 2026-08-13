import { describe, test, expect } from "bun:test";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { writeNginxConfigFile } from "../../src/utils/nginx-writer";
import { generateAppNginxConf, buildMagicIpDomain } from "../../src/utils/nginx-versiongate-site";

describe("writeNginxConfigFile & App Nginx Generator", () => {
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

  test("buildMagicIpDomain generates valid sslip.io host string", () => {
    const host = buildMagicIpDomain("app-myproject", "20.10.30.40");
    expect(host).toBe("app-myproject.20.10.30.40.sslip.io");
  });

  test("generateAppNginxConf outputs valid Nginx server block proxying to internal loopback port", () => {
    const conf = generateAppNginxConf({
      appId: "app-myproject",
      domainOrSubdomain: "app.userdomain.com",
      internalPort: 3100,
    });
    expect(conf).toContain("server_name app.userdomain.com _;");
    expect(conf).toContain("proxy_pass http://127.0.0.1:3100;");
    expect(conf).toContain("proxy_http_version 1.1;");
  });
});
