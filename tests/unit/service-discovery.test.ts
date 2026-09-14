import { describe, test, expect } from "bun:test";
import { ServiceDiscoveryService } from "../../src/services/service-discovery.service";

describe("Service Discovery & Adoption Engine", () => {
  const service = new ServiceDiscoveryService();

  test("extractGitMetadata returns empty object on non-git directory without throwing", () => {
    const meta = service.extractGitMetadata("C:\\non-existent-directory-xyz-123");
    expect(meta).toEqual({});
  });

  test("discoverUnmanagedServices returns an array of candidates", async () => {
    const candidates = await service.discoverUnmanagedServices();
    expect(Array.isArray(candidates)).toBe(true);
    for (const c of candidates) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.name).toBe("string");
      expect(["pm2", "docker"]).toContain(c.serviceType);
      expect(typeof c.alreadyAdopted).toBe("boolean");
    }
  });
});
