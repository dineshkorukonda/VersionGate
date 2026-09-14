import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  ProjectDomainService,
  inferExpectedServerIpv4,
} from "../../src/services/project-domain.service";
import dns from "dns/promises";

describe("DNS Preflight Verification", () => {
  const originalEnv = process.env.SERVER_PUBLIC_IPV4;

  beforeEach(() => {
    delete process.env.SERVER_PUBLIC_IPV4;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SERVER_PUBLIC_IPV4 = originalEnv;
    } else {
      delete process.env.SERVER_PUBLIC_IPV4;
    }
  });

  test("inferExpectedServerIpv4 returns valid IPv4 from env", () => {
    process.env.SERVER_PUBLIC_IPV4 = "192.0.2.1";
    expect(inferExpectedServerIpv4()).toBe("192.0.2.1");

    process.env.SERVER_PUBLIC_IPV4 = "invalid-ip";
    expect(inferExpectedServerIpv4()).toBeNull();
  });

  test("verifyDomainDns returns NOT_RESOLVED when no records exist", async () => {
    process.env.SERVER_PUBLIC_IPV4 = "198.51.100.10";

    const mockDomainRepo = {
      findById: mock(async (id: string) => {
        if (id === "dom-1") {
          return {
            id: "dom-1",
            projectId: "proj-1",
            hostname: "test.nonexistent.invalid",
            environmentName: "production",
            sslStatus: "pending_dns",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      }),
    } as any;

    const originalResolve4 = dns.resolve4;
    const originalResolveCname = dns.resolveCname;
    dns.resolve4 = mock(async () => {
      throw new Error("ENOTFOUND");
    }) as any;
    dns.resolveCname = mock(async () => {
      throw new Error("ENODATA");
    }) as any;

    try {
      const service = new ProjectDomainService(mockDomainRepo, {} as any);
      const res = await service.verifyDomainDns("dom-1");

      expect(res.hostname).toBe("test.nonexistent.invalid");
      expect(res.status).toBe("NOT_RESOLVED");
      expect(res.canIssueSsl).toBe(false);
      expect(res.records.a).toEqual([]);
    } finally {
      dns.resolve4 = originalResolve4;
      dns.resolveCname = originalResolveCname;
    }
  });

  test("verifyDomainDns returns MATCH when DNS A record matches expected IPv4", async () => {
    process.env.SERVER_PUBLIC_IPV4 = "198.51.100.10";

    const mockDomainRepo = {
      findById: mock(async () => ({
        id: "dom-2",
        projectId: "proj-1",
        hostname: "app.example.com",
        environmentName: "production",
        sslStatus: "pending_dns",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    } as any;

    const originalResolve4 = dns.resolve4;
    dns.resolve4 = mock(async () => ["198.51.100.10"]) as any;

    try {
      const service = new ProjectDomainService(mockDomainRepo, {} as any);
      const res = await service.verifyDomainDns("dom-2");

      expect(res.hostname).toBe("app.example.com");
      expect(res.status).toBe("MATCH");
      expect(res.canIssueSsl).toBe(true);
      expect(res.records.a).toEqual(["198.51.100.10"]);
    } finally {
      dns.resolve4 = originalResolve4;
    }
  });

  test("verifyDomainDns returns MISMATCH when DNS A record points to a different IP", async () => {
    process.env.SERVER_PUBLIC_IPV4 = "198.51.100.10";

    const mockDomainRepo = {
      findById: mock(async () => ({
        id: "dom-3",
        projectId: "proj-1",
        hostname: "app.example.com",
        environmentName: "production",
        sslStatus: "pending_dns",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    } as any;

    const originalResolve4 = dns.resolve4;
    dns.resolve4 = mock(async () => ["203.0.113.5"]) as any;

    try {
      const service = new ProjectDomainService(mockDomainRepo, {} as any);
      const res = await service.verifyDomainDns("dom-3");

      expect(res.hostname).toBe("app.example.com");
      expect(res.status).toBe("MISMATCH");
      expect(res.canIssueSsl).toBe(false);
      expect(res.records.a).toEqual(["203.0.113.5"]);
    } finally {
      dns.resolve4 = originalResolve4;
    }
  });
});
