import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

export const revalidate = 3600; // Revalidate dynamic releases every 1 hour (ISR)

export const metadata = {
  title: "Changelog // VersionGate",
  description: "Recent product updates, new features, and infrastructure improvements released in VersionGate.",
};

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  prerelease: boolean;
}

interface ReleaseItem {
  title: string;
  description: string;
  command?: string;
  prLink?: string;
  prNumber?: number;
}

interface ReleaseCategory {
  title: string;
  badge: "NEW" | "IMPROVEMENT" | "FIX";
  items: ReleaseItem[];
}

interface ProcessedRelease {
  version: string;
  date: string;
  isLatest?: boolean;
  summary: string;
  categories: ReleaseCategory[];
  url?: string;
}

const FALLBACK_RELEASES: ProcessedRelease[] = [
  {
    version: "v1.5.0",
    date: "July 30, 2026",
    isLatest: true,
    summary: "Automated Worker Self-Healing, Base-Href HTML Proxying, Auto-Detect Build Context & Relay Fixes.",
    categories: [
      {
        title: "New Features & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "Automated In-Process Worker Engine",
            description: "Embedded background worker started automatically on server boot, eliminating queue delays and removing the requirement for manual PM2 terminal restarts.",
            command: "versiongate worker status",
            prNumber: 149,
          },
          {
            title: "Vercel SalesOps Aesthetics Redesign",
            description: "Full Vercel-style UI dashboard overhaul adhering to strict monochromatic aesthetic.",
            prNumber: 151,
          },
          {
            title: "Base Href HTML Response Proxying",
            description: "Automatic injection of base href tags into proxied HTML responses for seamless CSS, JS, and static asset rendering across Next.js and Vite apps.",
            command: "versiongate proxy test",
            prNumber: 149,
          },
          {
            title: "Smart Repository Context Auto-Detection",
            description: "Vercel-style auto-fill of project names and subdirectory detection (website, dashboard, frontend) upon picking GitHub repositories.",
            command: "versiongate project create",
            prNumber: 149,
          },
        ],
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "July 29, 2026",
    isLatest: false,
    summary: "GitHub App Relay Proxying, Stage Path Reverse Proxy, Warm-Swap Rollbacks, API Bearer Tokens & Health Audit.",
    categories: [
      {
        title: "New Features & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "GitHub App Relay & Manual Installation Sync",
            description: "Automatic relay proxy fallback for self-hosted instances running without local GitHub App private keys, plus 1-click manual Installation ID sync when GitHub remains on settings page.",
            command: "versiongate github mode --type relay",
            prNumber: 130,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/130",
          },
          {
            title: "Stage Path Reverse Proxy Routing",
            description: "Reverse proxies stage environments cleanly on /p/:projectName/:stage without exposing raw container ports.",
            command: "versiongate proxy add --path /p/web-app/staging",
            prNumber: 128,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/128",
          },
          {
            title: "Instant Zero-Wait Warm-Swap Rollbacks",
            description: "Sub-second rollbacks reusing locally cached Docker image tags without git re-pulling or context rebuilds.",
            command: "versiongate rollback --project web-app --env production",
            prNumber: 120,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/120",
          },
          {
            title: "Bearer API Access Tokens for CI/CD",
            description: "SHA-256 hashed persistent vg_live_... API Bearer tokens for external CI/CD workflow automation.",
            command: "versiongate tokens create --name 'GitHub Actions CI'",
            prNumber: 119,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/119",
          },
          {
            title: "Universal One-Line Host Installer Endpoint",
            description: "Direct host endpoint serving install.sh at versiongate.tech/install.sh for automated zero-downtime VM setup.",
            command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
            prNumber: 135,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/135",
          },
        ],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "July 21, 2026",
    summary: "Quality Gates, Multi-Stage Promotion Pipelines, and Environment Chain Visualization.",
    categories: [
      {
        title: "Quality Gates & Promotion Pipelines",
        badge: "NEW",
        items: [
          {
            title: "Automated Soak & Health Check Gates",
            description: "Monitors latency and error rate thresholds for a defined soak window before promoting builds.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "May 03, 2026",
    summary: "Multi-tenant GitHub App Central Relay and Neon Database Integration.",
    categories: [
      {
        title: "Relay Architecture & Database Scaling",
        badge: "NEW",
        items: [
          {
            title: "Central GitHub App Relay Core",
            description: "HMAC-SHA256 signature verification (X-VG-Relay-Signature) and fan-out webhook forwarding.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "April 22, 2026",
    summary: "Initial Release of Self-Hosted Zero-Downtime Deployment Engine.",
    categories: [
      {
        title: "Core Deployment Engine",
        badge: "NEW",
        items: [
          {
            title: "Blue-Green Container Execution",
            description: "Multi-stage Docker container builds, atomic Nginx upstream switches, and automated database schema synchronization.",
          },
        ],
      },
    ],
  },
];

function parseReleaseBody(body: string): ReleaseCategory[] {
  if (!body) return [];
  const lines = body.split("\n");
  const categories: ReleaseCategory[] = [];
  let currentCategory: ReleaseCategory | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### Added") || trimmed.startsWith("## Added")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Added Capabilities", badge: "NEW", items: [] };
    } else if (trimmed.startsWith("### Changed") || trimmed.startsWith("## Changed") || trimmed.startsWith("### Improved")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Improvements & Updates", badge: "IMPROVEMENT", items: [] };
    } else if (trimmed.startsWith("### Fixed") || trimmed.startsWith("## Fixed")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Bug Fixes & Security", badge: "FIX", items: [] };
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      const boldMatch = itemText.match(/^\*\*(.*?)\*\*:\s*(.*)/);
      const title = boldMatch ? boldMatch[1] : itemText;
      const description = boldMatch ? boldMatch[2] : itemText;

      if (!currentCategory) {
        currentCategory = { title: "Release Highlights", badge: "NEW", items: [] };
      }
      currentCategory.items.push({ title, description });
    }
  }

  if (currentCategory) categories.push(currentCategory);
  return categories;
}

async function fetchGitHubReleases(): Promise<ProcessedRelease[]> {
  try {
    const res = await fetch("https://api.github.com/repos/dineshkorukonda/VersionGate/releases", {
      headers: {
        "User-Agent": "VersionGate-Website-Changelog",
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return FALLBACK_RELEASES;
    }

    const data: GitHubRelease[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_RELEASES;
    }

    return data.map((rel, idx) => {
      const parsedCategories = parseReleaseBody(rel.body);
      const rawTitle = rel.name || rel.tag_name;
      const titleParts = rawTitle.split(" — ");
      const summary = titleParts.length > 1 ? titleParts[1] : rel.tag_name;

      const dateObj = new Date(rel.published_at);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        version: rel.tag_name,
        date: formattedDate,
        isLatest: idx === 0,
        summary: summary,
        categories: parsedCategories.length > 0 ? parsedCategories : FALLBACK_RELEASES[idx]?.categories || [],
        url: rel.html_url,
      };
    });
  } catch (err) {
    return FALLBACK_RELEASES;
  }
}

export default async function ChangelogPage() {
  const releases = await fetchGitHubReleases();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <SiteHeader active="features" />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Page Header */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Changelog // GitHub API Auto-Sync
              </span>
            </div>
            <span className="rounded bg-muted border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              [ AUTO-UPDATED VIA GITHUB RELEASES ]
            </span>
          </div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          <p className="max-w-2xl font-sans text-sm text-muted-foreground leading-relaxed">
            Live, automatically synced product updates, feature releases, and infrastructure improvements powered by GitHub Releases.
          </p>
        </div>

        {/* Timeline Entries */}
        <div className="mt-10 space-y-16">
          {releases.map((rel) => (
            <section key={rel.version} className="relative grid gap-8 md:grid-cols-12">
              {/* Left Column: Version & Date */}
              <div className="md:col-span-3 space-y-2">
                <div className="sticky top-20 flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground">
                    {rel.version}
                  </span>
                  {rel.isLatest ? (
                    <span className="rounded bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
                      LATEST
                    </span>
                  ) : null}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {rel.date}
                </p>
                {rel.url ? (
                  <div className="pt-2">
                    <Link
                      href={rel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      View GitHub Release
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Right Column: Release Content */}
              <div className="md:col-span-9 space-y-8 rounded-lg border border-border bg-card p-6 sm:p-8">
                <p className="font-sans text-sm font-medium text-foreground leading-relaxed border-b border-border pb-4">
                  {rel.summary}
                </p>

                {rel.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted text-foreground border border-border px-2 py-0.5 font-mono text-[10px] font-semibold">
                        [ {cat.badge} ]
                      </span>
                      <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {cat.title}
                      </h2>
                    </div>

                    <div className="grid gap-4">
                      {cat.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="rounded-md border border-border bg-muted/40 p-4 space-y-2 transition hover:border-foreground/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-sans text-sm font-semibold text-foreground">
                              {item.title}
                            </h3>
                            {item.prNumber && item.prLink ? (
                              <Link
                                href={item.prLink}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                              >
                                PR #{item.prNumber}
                              </Link>
                            ) : null}
                          </div>

                          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>

                          {item.command ? (
                            <div className="mt-2 rounded bg-background border border-border px-3 py-1.5 font-mono text-[11px] text-foreground overflow-x-auto">
                              <code>{item.command}</code>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
