import { describe, test, expect } from "bun:test";

function buildHealthCheckUrls(baseUrl: string, healthPath: string): string[] {
  const base = baseUrl.replace(/\/$/, "");
  const p = healthPath.startsWith("/") ? healthPath : `/${healthPath}`;
  const primary = `${base}${p}`;
  const extras: string[] = [];
  if (p !== "/") extras.push(`${base}/`);
  if (p !== "/index.html") extras.push(`${base}/index.html`);
  const seen = new Set<string>([primary]);
  const ordered = [primary];
  for (const u of extras) {
    if (!seen.has(u)) {
      seen.add(u);
      ordered.push(u);
    }
  }
  return ordered;
}

describe("Health check URL builder", () => {
  test("builds primary URL with path and fallbacks", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/health");
    expect(urls).toEqual([
      "http://localhost:8080/health",
      "http://localhost:8080/",
      "http://localhost:8080/index.html",
    ]);
  });

  test("handles trailing slash on base URL cleanly", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080/", "api/ping");
    expect(urls[0]).toBe("http://localhost:8080/api/ping");
  });

  test("does not duplicate root path if healthPath is /", () => {
    const urls = buildHealthCheckUrls("http://localhost:8080", "/");
    expect(urls).toEqual([
      "http://localhost:8080/",
      "http://localhost:8080/index.html",
    ]);
  });
});
