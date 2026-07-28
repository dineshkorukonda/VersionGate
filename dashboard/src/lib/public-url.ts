import { cleanHostname } from "@/lib/deployment-display";

/** Matches backend `normalizePublicBasePath` (leading slash, no trailing slash except `/`). */
export function normalizePublicBasePath(raw: string): string {
  let p = raw.trim();
  if (!p || p === "/") return "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

export function looksLikeIpv4(host: string): boolean {
  const cleaned = cleanHostname(host);
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned);
}

/** Preview URL for the dashboard (scheme guessed: HTTP for raw IPv4, HTTPS for hostnames). */
export function formatPublicDashboardUrl(publicDomain: string, publicBasePath: string): string | null {
  const raw = publicDomain.trim();
  if (!raw) return null;
  
  let proto = "http";
  let host = raw;
  if (/^https:\/\//i.test(raw)) {
    proto = "https";
    host = raw.replace(/^https:\/\//i, "");
  } else if (/^http:\/\//i.test(raw)) {
    proto = "http";
    host = raw.replace(/^http:\/\//i, "");
  } else {
    proto = looksLikeIpv4(raw) ? "http" : "https";
  }
  
  host = host.split("/")[0].split("?")[0].split("#")[0].trim();
  if (!host) return null;
  
  const path = normalizePublicBasePath(publicBasePath || "/");
  const origin = `${proto}://${host}`;
  return path === "/" ? origin : `${origin}${path}`;
}
