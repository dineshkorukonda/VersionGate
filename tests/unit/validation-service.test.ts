import { describe, test, expect } from "bun:test";
import { buildHealthCheckUrls } from "../../src/services/validation.service";

describe("Health check URL builder", () => {
  test("builds primary URL with path, IPv4 alternatives, and common API fallbacks", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/health");
    expect(urls[0]).toBe("http://localhost:8080/health");
    expect(urls).toContain("http://127.0.0.1:8080/health");
    expect(urls).toContain("http://localhost:8080/");
    expect(urls).toContain("http://127.0.0.1:8080/");
    expect(urls).toContain("http://localhost:8080/api/health");
  });

  test("handles trailing slash on base URL cleanly", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080/", "api/ping");
    expect(urls[0]).toBe("http://localhost:8080/api/ping");
  });

  test("does not duplicate root path if healthPath is /", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/");
    expect(urls[0]).toBe("http://localhost:8080/");
    expect(urls).toContain("http://127.0.0.1:8080/");
    expect(urls).toContain("http://localhost:8080/index.html");
  });
});
