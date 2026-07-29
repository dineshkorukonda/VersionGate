import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

export const metadata = {
  title: "Changelog // VersionGate",
  description: "Recent product updates, new features, and infrastructure improvements released in VersionGate.",
};

interface ReleaseCategory {
  type: "Added" | "Changed" | "Fixed";
  title: string;
  badge: "NEW" | "IMPROVEMENT" | "FIX";
  items: {
    title: string;
    description: string;
    command?: string;
    prLink?: string;
    prNumber?: number;
  }[];
}

interface ReleaseEntry {
  version: string;
  date: string;
  isLatest?: boolean;
  summary: string;
  categories: ReleaseCategory[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "v1.4.0",
    date: "July 29, 2026",
    isLatest: true,
    summary: "GitHub App Relay Proxying, Stage Path Reverse Proxy, Warm-Swap Rollbacks, API Bearer Tokens & Health Audit.",
    categories: [
      {
        type: "Added",
        title: "New Features & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "GitHub App Relay & Custom Manifest Proxy",
            description: "Automatic relay proxy fallback for self-hosted instances running without local GitHub App private keys. Supports zero-config central cloud relay or 1-click custom manifest setup.",
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
        ],
      },
      {
        type: "Changed",
        title: "UI & Theme Enhancements",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Vercel & shadcn Theme Redesign",
            description: "Redesigned marketing website and management dashboard with Vercel and shadcn design tokens, Poppins typography, and working light/dark mode toggles.",
            prNumber: 125,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/125",
          },
          {
            title: "URL Hostname Sanitization Engine",
            description: "Added cleanHostname in dashboard utilities to strip malformed schemes, duplicate ports, and request paths.",
            prNumber: 117,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/117",
          },
        ],
      },
      {
        type: "Fixed",
        title: "Security & Database Fixes",
        badge: "FIX",
        items: [
          {
            title: "Nginx Permissive Directory Writes",
            description: "Added safe write helper with sudo fallback and preflight write checks.",
            prNumber: 112,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/112",
          },
          {
            title: "Database Timestamp Null Constraints",
            description: "Passed explicit createdAt and updatedAt Date objects in enqueueJob and DeploymentRepository.create.",
            prNumber: 111,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/111",
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
        type: "Added",
        title: "Quality Gates & Promotion Pipelines",
        badge: "NEW",
        items: [
          {
            title: "Automated Soak & Health Check Gates",
            description: "Monitors latency and error rate thresholds for a defined soak window before promoting builds.",
          },
          {
            title: "Manual Approval & Webhook Gates",
            description: "Integrates team sign-offs and third-party webhook verification checks into deployment chains.",
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
        type: "Added",
        title: "Relay Architecture & Database Scaling",
        badge: "NEW",
        items: [
          {
            title: "Central GitHub App Relay Core",
            description: "HMAC-SHA256 signature verification (X-VG-Relay-Signature) and fan-out webhook forwarding.",
          },
          {
            title: "PostgreSQL Migration Baselining",
            description: "Split local vs hosted PostgreSQL migration baselines via Drizzle ORM.",
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
        type: "Added",
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

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <SiteHeader active="features" />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Page Header */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Changelog // Product Updates
            </span>
          </div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          <p className="max-w-2xl font-sans text-sm text-muted-foreground leading-relaxed">
            New features, infrastructure upgrades, security patches, and release notes for VersionGate.
          </p>
        </div>

        {/* Timeline Entries */}
        <div className="mt-10 space-y-16">
          {RELEASES.map((rel) => (
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
              </div>

              {/* Right Column: Release Content */}
              <div className="md:col-span-9 space-y-8 rounded-lg border border-border bg-card p-6 sm:p-8">
                <p className="font-sans text-sm font-medium text-foreground leading-relaxed border-b border-border pb-4">
                  {rel.summary}
                </p>

                {rel.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold border ${
                          cat.badge === "NEW"
                            ? "bg-muted text-foreground border-border"
                            : cat.badge === "IMPROVEMENT"
                              ? "bg-muted text-foreground border-border"
                              : "bg-muted text-foreground border-border"
                        }`}
                      >
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
