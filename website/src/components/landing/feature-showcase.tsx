interface Feature {
  title: string;
  description: string;
  detail: string;
}

const FEATURES: Feature[] = [
  {
    title: "Blue/green zero-downtime deploys",
    description:
      "Every production environment gets two slots. VersionGate builds on the idle port, health-checks the new container, then reloads Nginx upstream — no dropped connections.",
    detail: "Warm-swap rollback reuses cached images in under 2 seconds.",
  },
  {
    title: "Docker or bare-metal PM2",
    description:
      "Run containerized apps or host processes directly with PM2. Auto-detects Bun, pnpm, uv, Poetry, Cargo, and Composer from your repository.",
    detail: "One project wizard for repo, build commands, and encrypted env vars.",
  },
  {
    title: "Database studio built in",
    description:
      "Provision PostgreSQL, Redis, MySQL, or MongoDB on the server. Inspect schemas, run queries, and link credentials into projects without leaving the dashboard.",
    detail: "SQL, Redis, and Mongo query runners with export to JSON or CSV.",
  },
  {
    title: "Deployments you can actually read",
    description:
      "Global and per-project deployment feeds show commit message, author, branch, SHA, environment, status, and duration — the same view you use to debug production.",
    detail: "Route-synced project tabs for Deployments, Domains, Logs, and Settings.",
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
                <div className="space-y-3">
                  <div className="h-2 w-24 rounded bg-neutral-800" />
                  <div className="h-2 w-full rounded bg-neutral-800/80" />
                  <div className="h-2 w-[83%] rounded bg-neutral-800/60" />
                  <div className="mt-6 rounded-lg border border-neutral-800 bg-[#0a0a0a] p-4">
                    <p className="font-mono text-xs text-neutral-500">{feature.title}</p>
                    <p className="mt-2 font-mono text-xs text-emerald-400/90">
                      {index === 0 && "GET /health → 200 OK · nginx -s reload"}
                      {index === 1 && "deploymentType: pm2 | docker · packageManager: bun"}
                      {index === 2 && "POST /api/v1/databases/:id/query"}
                      {index === 3 && "GET /api/v1/deployments · GET /projects/:id/commits"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
