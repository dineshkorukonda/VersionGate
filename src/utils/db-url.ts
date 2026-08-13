/**
 * Sanitizes and normalizes PostgreSQL database URLs for cloud database providers
 * (Supabase, Neon, Render, CockroachDB, etc.) prior to setup validation and connection initialization.
 */
export function normalizeDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  let urlStr = rawUrl.trim();
  if (!urlStr) return rawUrl;

  // Ensure correct protocol prefix
  if (!urlStr.startsWith("postgres://") && !urlStr.startsWith("postgresql://")) {
    urlStr = `postgresql://${urlStr}`;
  }

  try {
    const parsed = new URL(urlStr);

    // Detect cloud database providers requiring SSL enforcement
    const hostname = parsed.hostname.toLowerCase();
    const isCloudHost =
      hostname.includes("supabase.co") ||
      hostname.includes("supabase.com") ||
      hostname.includes("neon.tech") ||
      hostname.includes("render.com") ||
      hostname.includes("cockroachlabs.cloud") ||
      hostname.includes("aws.neon.tech");

    // Enforce SSL for cloud instances if sslmode parameter is missing
    if (isCloudHost && !parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    // Handle Supabase PgBouncer pooler requirement (Port 6543)
    if (hostname.includes("supabase") && parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }

    return parsed.toString();
  } catch (_err) {
    // If standard URL parsing fails (e.g. unescaped special characters in credentials),
    // append required query parameters gracefully to the raw string.
    const isKnownCloudHost =
      urlStr.includes("supabase.co") ||
      urlStr.includes("supabase.com") ||
      urlStr.includes("neon.tech") ||
      urlStr.includes("render.com");

    if (isKnownCloudHost && !urlStr.includes("sslmode=")) {
      const separator = urlStr.includes("?") ? "&" : "?";
      urlStr = `${urlStr}${separator}sslmode=require`;
    }

    if (urlStr.includes("supabase") && urlStr.includes(":6543") && !urlStr.includes("pgbouncer=")) {
      const separator = urlStr.includes("?") ? "&" : "?";
      urlStr = `${urlStr}${separator}pgbouncer=true`;
    }

    return urlStr;
  }
}
