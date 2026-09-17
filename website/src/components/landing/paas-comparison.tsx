"use client";

interface ComparisonRow {
  feature: string;
  versiongate: string;
  dokploy: string;
  coolify: string;
  vercel: string;
}

const ROWS: ComparisonRow[] = [
  {
    feature: "Zero-Downtime Blue/Green Slotting",
    versiongate: "[ NATIVE BUILT-IN ]",
    dokploy: "Traefik based",
    coolify: "Traefik based",
    vercel: "Proprietary Cloud",
  },
  {
    feature: "In-Dashboard UI DB Studio & Query Console",
    versiongate: "[ FULL SQL/REDIS RUNNER ]",
    dokploy: "Basic status",
    coolify: "External tool required",
    vercel: "Cloud add-on",
  },
  {
    feature: "Host Bare-Metal PM2 Supervision",
    versiongate: "[ YES (Docker or PM2) ]",
    dokploy: "Docker only",
    coolify: "Docker only",
    vercel: "Serverless only",
  },
  {
    feature: "Server Deployment Auto-Adoption",
    versiongate: "[ 1-CLICK DISCOVERY ]",
    dokploy: "Manual recreation",
    coolify: "Manual recreation",
    vercel: "Not supported",
  },
  {
    feature: "Preflight DNS Check before Let's Encrypt",
    versiongate: "[ BUILT-IN PREFLIGHT ]",
    dokploy: "Direct certbot attempt",
    coolify: "Direct certbot attempt",
    vercel: "Cloud managed",
  },
  {
    feature: "Self-Hosted on Single Low-Spec VPS",
    versiongate: "[ YES (Lightweight Fastify) ]",
    dokploy: "Yes",
    coolify: "Yes",
    vercel: "No (Hosted SaaS)",
  },
  {
    feature: "License & Vendor Lock-In",
    versiongate: "[ MIT OPEN SOURCE / FREE ]",
    dokploy: "Open Source / Cloud",
    coolify: "Open Source / Cloud",
    vercel: "Vendor Locked SaaS",
  },
];

export function PaasComparison() {
  return (
    <section className="py-20 border-t border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ TECHNICAL COMPARISON ]
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How VersionGate Compares
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Built for developers who want the convenience of modern PaaS platforms without
            the bloat, cloud fees, or unpredictable server resource overhead.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto rounded-lg border border-border/70 bg-zinc-950">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-900/90 text-zinc-300 uppercase tracking-wider">
              <tr>
                <th className="p-4 border-b border-border/60">Capability / Feature</th>
                <th className="p-4 border-b border-border/60 text-primary font-bold">
                  VersionGate
                </th>
                <th className="p-4 border-b border-border/60 text-zinc-400">Dokploy</th>
                <th className="p-4 border-b border-border/60 text-zinc-400">Coolify</th>
                <th className="p-4 border-b border-border/60 text-zinc-400">Vercel / Render</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-zinc-300">
              {ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-zinc-900/40 transition">
                  <td className="p-4 font-sans font-medium text-foreground">{row.feature}</td>
                  <td className="p-4 text-primary font-bold">{row.versiongate}</td>
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
