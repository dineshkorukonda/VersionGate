import type { ReactNode } from "react";

interface Feature {
  title: string;
  description: string;
  detail: string;
  visual: ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: "Blue/green zero-downtime deploys",
    description:
      "Every production environment gets two slots. VersionGate builds on the idle port, health-checks the new container, then reloads Nginx upstream — no dropped connections.",
    detail: "Warm-swap rollback reuses cached images in under 2 seconds.",
    visual: (
      <div className="space-y-3 font-mono text-[11px]">
        <div className="flex items-center justify-between rounded border border-neutral-800 bg-black px-3 py-2">
          <span className="text-neutral-400">slot-a :8081</span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">[ LIVE ]</span>
        </div>
        <div className="flex items-center justify-between rounded border border-neutral-800 bg-black px-3 py-2">
          <span className="text-neutral-400">slot-b :8082</span>
          <span className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-300">[ BUILDING ]</span>
        </div>
        <p className="text-emerald-400/90">GET /health → 200 OK · nginx -s reload</p>
      </div>
    ),
  },
  {
    title: "Docker or bare-metal PM2",
    description:
      "Run containerized apps or host processes directly with PM2. Auto-detects Bun, pnpm, uv, Poetry, Cargo, and Composer from your repository.",
    detail: "One project wizard for repo, build commands, and encrypted env vars.",
    visual: (
      <div className="space-y-2 font-mono text-[11px] text-neutral-300">
        <p><span className="text-neutral-500">deploymentType:</span> pm2 | docker</p>
        <p><span className="text-neutral-500">packageManager:</span> bun</p>
        <p><span className="text-neutral-500">buildCommand:</span> bun run build</p>
        <p><span className="text-neutral-500">startCommand:</span> bun run start</p>
      </div>
    ),
  },
  {
    title: "Database studio built in",
    description:
      "Provision PostgreSQL, Redis, MySQL, or MongoDB on the server. Inspect schemas, run queries, and link credentials into projects without leaving the dashboard.",
    detail: "SQL, Redis, and Mongo query runners with export to JSON or CSV.",
    visual: (
      <div className="space-y-2 font-mono text-[11px]">
        <p className="text-neutral-500">POST /api/v1/databases/:id/query</p>
        <pre className="overflow-x-auto rounded border border-neutral-800 bg-black p-3 text-emerald-400/90">
{`SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';`}
        </pre>
      </div>
    ),
  },
  {
    title: "Deployments you can actually read",
    description:
      "Global and per-project deployment feeds show commit message, author, branch, SHA, environment, status, and duration — the same view you use to debug production.",
    detail: "Route-synced project tabs for Deployments, Domains, Logs, and Settings.",
    visual: (
      <div className="divide-y divide-neutral-800 font-mono text-[11px]">
        <div className="flex items-center justify-between py-2">
          <span className="truncate text-neutral-300">feat: add deployment logs UI</span>
          <span className="shrink-0 text-emerald-400">[ READY ]</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="truncate text-neutral-300">fix: nginx upstream reload</span>
          <span className="shrink-0 text-sky-300">[ BUILDING ]</span>
        </div>
      </div>
    ),
  },
];

export function FeatureShowcase() {
  return (
    <section id="features" className="border-t border-neutral-800 py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Platform</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything on your machine, under your control
          </h2>
          <p className="mt-4 text-neutral-400">
            VersionGate replaces the deploy layer of a cloud PaaS with software you host once on a VPS.
          </p>
        </div>

        <div className="mt-16 space-y-20">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-16 ${
                index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{feature.description}</p>
                <p className="mt-4 text-sm text-neutral-500">{feature.detail}</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                {feature.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
