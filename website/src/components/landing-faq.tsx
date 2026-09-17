"use client";

import { useState } from "react";

interface FAQ {
  q: string;
  a: string;
  code?: string;
}

const FAQS: FAQ[] = [
  {
    q: "How does VersionGate achieve zero-downtime without Traefik or Kubernetes?",
    a: "VersionGate maintains a blue/green port pair per project environment. During a rollout it starts the new container on the idle port, validates HTTP health checks, then atomically updates the Nginx upstream via nginx -s reload.",
    code: "TrafficService.switchTrafficTo(slot) & nginx -s reload",
  },
  {
    q: "Can I deploy bare-metal PM2 services instead of Docker?",
    a: "Yes. When creating a project you can select PM2 bare-metal to run processes directly on the host with automatic package manager detection for Bun, pnpm, yarn, npm, uv, poetry, cargo, and composer.",
  },
  {
    q: "How does the in-dashboard database studio work?",
    a: "The database studio lets you inspect tables, examine schemas, and execute SQL, Redis commands, or MongoDB operations directly against provisioned containers with millisecond timing and JSON/CSV export.",
  },
  {
    q: "Can VersionGate adopt containers already running on my server?",
    a: "Yes. Server deployment auto-adoption scans for existing Docker containers and PM2 processes, detects ports and working directories, and imports them into VersionGate management in one click.",
    code: "GET /api/v1/system/discover-deployments",
  },
  {
    q: "How does DNS preflight prevent Let's Encrypt rate-limit bans?",
    a: "Before requesting a TLS certificate, VersionGate queries DNS A and CNAME records against the server's public IPv4. If DNS has not propagated, Certbot execution is blocked to protect your domain.",
  },
  {
    q: "What are the minimum server requirements?",
    a: "VersionGate runs on a VPS with 1 vCPU and 1 GB RAM (Ubuntu 22.04+ or Debian 12) alongside Docker Engine, PostgreSQL 16, and Nginx.",
  },
];

export function LandingFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-20 border-t border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Technical questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-lg border border-border/60 bg-zinc-950 p-5 transition hover:border-border"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 text-primary">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-3 border-t border-border/40 text-xs leading-relaxed text-zinc-400">
                    <p>{faq.a}</p>
                    {faq.code && (
                      <pre className="mt-3 rounded-md bg-black p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
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
