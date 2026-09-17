"use client";

import { useState } from "react";

interface FAQ {
  q: string;
  a: string;
  code?: string;
}

const FAQS: FAQ[] = [
  {
    q: "How does VersionGate achieve zero-downtime deployments without Traefik or Kubernetes?",
    a: "VersionGate runs an internal slot allocator that maintains a BLUE/GREEN port pair per project environment. During a rollout, it starts the new container on the idle port, validates HTTP health check responses (e.g. HTTP 200), and atomically updates the Nginx upstream configuration via nginx -s reload. Active incoming TCP connections are preserved without dropping packets.",
    code: "TrafficService.switchTrafficTo(slot) & nginx -s reload",
  },
  {
    q: "Can I deploy bare-metal PM2 Node/Bun/Python/Rust services instead of Docker?",
    a: "Yes. VersionGate v2.9.5 provides dual execution engines. When creating a project, you can select 'PM2 Bare-Metal' to run processes directly on the host using PM2 process supervision with automatic package manager detection (Bun, pnpm, yarn, npm, uv, poetry, cargo, composer).",
  },
  {
    q: "How does the in-dashboard UI Database Studio work?",
    a: "The Database Studio allows you to inspect tables, examine column schemas, and execute raw SQL, Redis commands, or MongoDB operations directly against your provisioned containers. Queries are executed in isolated background worker threads with millisecond execution timing and one-click JSON/CSV data export.",
  },
  {
    q: "Can VersionGate adopt containers or PM2 apps already running on my server?",
    a: "Yes. The Server Deployment Auto-Adoption feature scans the host system for existing external Docker containers and active PM2 processes, auto-detects their open ports and working directories, and imports them into VersionGate zero-downtime management with a single click.",
    code: "GET /api/v1/system/discover-deployments",
  },
  {
    q: "How does DNS preflight verification prevent Let's Encrypt rate-limit bans?",
    a: "Before requesting a TLS certificate from Certbot, VersionGate conducts DNS A and CNAME record queries against the server's public IPv4 address. If DNS has not propagated yet or points to an incorrect host, Certbot execution is safely blocked, protecting your domain from Let's Encrypt 5-failure-per-hour rate limits.",
  },
  {
    q: "What are the minimum server requirements to host VersionGate?",
    a: "VersionGate is extremely lightweight (built on Fastify and Drizzle ORM). It runs smoothly on a VPS with 1 vCPU and 1 GB RAM (Ubuntu 22.04+ or Debian 12) alongside Docker Engine, PostgreSQL 16, and Nginx.",
  },
];

export function LandingFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-20 border-t border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ FREQUENTLY ASKED QUESTIONS ]
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Technical Architecture &amp; Operations
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-lg border border-border/60 bg-zinc-950/80 p-5 transition hover:border-border"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left font-mono text-sm font-semibold text-foreground"
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 text-primary font-bold">
                    {isOpen ? "[-]" : "[+]"}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-3 border-t border-border/40 font-sans text-xs leading-relaxed text-zinc-400">
                    <p>{faq.a}</p>
                    {faq.code && (
                      <pre className="mt-3 rounded bg-black p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                        <code>{faq.code}</code>
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
