import { describe, test, expect } from "bun:test";
import { NginxUpstreamService, sanitizeNginxIdentifier } from "../../src/services/nginx-upstream.service";

describe("NginxUpstreamService", () => {
  const service = new NginxUpstreamService();

  test("sanitizeNginxIdentifier removes invalid characters and lowercases", () => {
    expect(sanitizeNginxIdentifier("My-App-Name!")).toBe("my_app_name_");
    expect(sanitizeNginxIdentifier("staging-v1")).toBe("staging_v1");
  });

  test("buildUpstreamName returns versiongate_backend when no project name provided", () => {
    expect(service.buildUpstreamName()).toBe("versiongate_backend");
  });

  test("buildUpstreamName incorporates project and environment names", () => {
    expect(service.buildUpstreamName("my-app", "production")).toBe("versiongate_upstream_my_app_production");
  });

  test("buildNginxUpstreamConfig generates valid Nginx upstream syntax", () => {
    const conf = service.buildNginxUpstreamConfig({
      projectName: "demo-api",
      environmentName: "production",
      port: 8001,
    });

    expect(conf).toContain("upstream versiongate_upstream_demo_api_production {");
    expect(conf).toContain("server 127.0.0.1:8001;");
    expect(conf).toContain("upstream versiongate_backend {");
  });
});
