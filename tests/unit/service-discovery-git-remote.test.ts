import { describe, test, expect } from "bun:test";
import { ServiceDiscoveryService } from "../../src/services/service-discovery.service";

describe("Service Discovery Git Remote Extraction", () => {
  const service = new ServiceDiscoveryService();

  test("service discovery class exposes extractGitRemote method", () => {
    expect(typeof (service as any).extractGitRemote).toBe("function");
  });

  test("extractGitRemote returns null on invalid or non-existent path", async () => {
    const remote = await (service as any).extractGitRemote("/non/existent/path/xyz");
    expect(remote).toBeNull();
  });
});
