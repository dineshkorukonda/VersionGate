interface ComparisonRow {
  feature: string;
  versiongate: string;
  dokploy: string;
  coolify: string;
  vercel: string;
}

const ROWS: ComparisonRow[] = [
  {
    feature: "Zero-downtime blue/green slotting",
    versiongate: "Native built-in",
    dokploy: "Traefik based",
    coolify: "Traefik based",
    vercel: "Proprietary cloud",
  },
  {
    feature: "In-dashboard DB studio",
    versiongate: "Full SQL/Redis runner",
    dokploy: "Basic status",
    coolify: "External tool required",
    vercel: "Cloud add-on",
  },
  {
    feature: "Host bare-metal PM2 supervision",
    versiongate: "Docker or PM2",
    dokploy: "Docker only",
    coolify: "Docker only",
    vercel: "Serverless only",
  },
  {
    feature: "Git webhook and commit auto-deploy",
    versiongate: "Built-in poller + webhooks",
    dokploy: "Manual webhook setup",
    coolify: "Manual webhook setup",
    vercel: "Git integration only",
  },
  {
    feature: "Preflight DNS before Let's Encrypt",
    versiongate: "Built-in preflight",
    dokploy: "Direct certbot attempt",
    coolify: "Direct certbot attempt",
    vercel: "Cloud managed",
  },
  {
    feature: "Self-hosted on a single VPS",
    versiongate: "Lightweight Fastify",
    dokploy: "Yes",
    coolify: "Yes",
    vercel: "Hosted SaaS",
  },
  {
    feature: "License and vendor lock-in",
    versiongate: "MIT open source",
    dokploy: "Open source / cloud",
    coolify: "Open source / cloud",
    vercel: "Vendor locked SaaS",
  },
];

export function PaasComparison() {
  return (
    <section className="py-20 border-t border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Comparison</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How VersionGate compares
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Modern PaaS convenience without cloud fees, bloat, or unpredictable resource overhead.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto rounded-lg border border-border/60 bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="p-4 border-b border-border/60 font-medium">Feature</th>
                <th className="p-4 border-b border-border/60 text-primary font-semibold">VersionGate</th>
                <th className="p-4 border-b border-border/60 text-zinc-400 font-medium">Dokploy</th>
                <th className="p-4 border-b border-border/60 text-zinc-400 font-medium">Coolify</th>
                <th className="p-4 border-b border-border/60 text-zinc-400 font-medium">Vercel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-zinc-300">
              {ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-zinc-900/40 transition">
                  <td className="p-4 font-medium text-foreground">{row.feature}</td>
                  <td className="p-4 text-primary font-medium">{row.versiongate}</td>
                  <td className="p-4 text-zinc-400">{row.dokploy}</td>
                  <td className="p-4 text-zinc-400">{row.coolify}</td>
                  <td className="p-4 text-zinc-400">{row.vercel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
