import { describe, test, expect } from "bun:test";
import { buildHealthCheckUrls } from "../../src/services/validation.service";

describe("Health check URL builder", () => {
  test("builds primary URL first and includes fallback candidates", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/health");
    expect(urls[0]).toBe("http://localhost:8080/health");
    expect(urls).toContain("http://localhost:8080/");
    expect(urls).toContain("http://localhost:8080/api/health");
    expect(urls).toContain("http://localhost:8080/ping");
    expect(urls).toContain("http://127.0.0.1:8080/health");
    expect(urls).toContain("http://127.0.0.1:8080/");
  });

  test("handles trailing slash on base URL cleanly", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080/", "api/ping");
    expect(urls[0]).toBe("http://localhost:8080/api/ping");
  });

  test("does not produce duplicate URLs", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/");
    const unique = new Set(urls);
    expect(urls.length).toBe(unique.size);
    expect(urls[0]).toBe("http://localhost:8080/");
  });

  test("supports 127.0.0.1 base and resolves localhost partner", () => {
    const urls = buildHealthCheckUrls("http://127.0.0.1:6600", "/status");
    expect(urls[0]).toBe("http://127.0.0.1:6600/status");
    expect(urls).toContain("http://localhost:6600/status");
  });
});
