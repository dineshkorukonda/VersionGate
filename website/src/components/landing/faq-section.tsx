"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  tag: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does zero-downtime blue/green deployment work on a single VPS?",
    answer:
      "Every production environment is allocated two dedicated internal ports (Slot Blue and Slot Green). When you push code, VersionGate builds and boots the new version on the idle slot while the active slot continues serving live traffic. Once the new slot passes automated HTTP health probes (HTTP 200 OK), VersionGate atomically rewrites the Nginx upstream configuration and triggers 'nginx -s reload'. Active TCP connections complete gracefully and new requests immediately hit the healthy slot — resulting in 0 dropped requests and 0ms downtime.",
    tag: "Deployment",
  },
  {
    question: "How does VersionGate compare to Coolify, Dokploy, and Vercel?",
    answer:
      "Unlike cloud PaaS platforms like Vercel, VersionGate is 100% self-hosted on your own hardware ($5/month VPS or bare-metal server) with zero per-seat fees or resource markups. Compared to Coolify or Dokploy which rely primarily on standard Docker Compose redeploys (which briefly drop traffic while recreating containers), VersionGate implements true isolated Blue/Green slot switching at the Nginx reverse-proxy layer and native bare-metal PM2 process supervision alongside Docker.",
    tag: "Comparison",
  },
  {
    question: "Can I run applications directly on the host with PM2 without Docker?",
    answer:
      "Yes! VersionGate features dual deployment engines: Docker containers and bare-metal PM2 host supervision. For lightweight Node.js, Python, or Go microservices where container virtualization overhead is undesirable, VersionGate manages host processes via PM2, allocating isolated ports, running build scripts, tracking process metrics, and switching Nginx upstreams with identical zero-downtime guarantees.",
    tag: "Runtimes",
  },
  {
    question: "What happens if a deployment build or health check fails?",
    answer:
      "Your live production traffic is completely untouched. Because new builds are isolated in the idle slot, any compilation errors, missing dependencies, or failed health probes immediately halt the deployment pipeline. The failed slot is stopped and diagnostic logs are presented in the deployment terminal. Your existing healthy container or PM2 process continues serving users without a microsecond of disruption.",
    tag: "Reliability",
  },
  {
    question: "How do sub-2-second warm-swap rollbacks work?",
    answer:
      "VersionGate retains the local Docker image and configuration of your previous successful deployment in a warm cache. If a regression occurs after release, clicking 'Rollback' bypasses git pulls, dependency installs, and container builds. The engine spins up the cached previous image, validates its health check, and repoints Nginx upstream in under 2 seconds.",
    tag: "Rollback",
  },
  {
    question: "How are databases handled, and can projects connect automatically?",
    answer:
      "You can provision isolated PostgreSQL, Redis, MySQL, or MongoDB instances directly from the dashboard with persistent Docker volumes. VersionGate includes an in-browser Database Studio to inspect table schemas, run raw SQL queries, and view telemetry. With 1-click database linking, connection strings (e.g. DATABASE_URL) are automatically injected into your project's encrypted environment variables.",
    tag: "Databases",
  },
  {
    question: "How does automatic SSL/TLS work with custom domains?",
    answer:
      "When adding a custom domain, VersionGate first runs an automated DNS preflight probe verifying that the domain's A or CNAME record has propagated to your VPS IPv4. This pre-check prevents Let's Encrypt rate-limit lockouts. Once verified, VersionGate invokes Certbot via Nginx plugin to issue and auto-renew TLS certificates with HTTP/2 and modern cipher suites.",
    tag: "Networking",
  },
  {
    question: "What are the minimum server requirements to run VersionGate?",
    answer:
      "VersionGate is engineered with high-efficiency compiled tools and minimal runtime footprint. The engine, Fastify API, PostgreSQL metadata store, Redis broker, and Nginx proxy run comfortably on a single 1 vCPU / 1 GB RAM VPS (Ubuntu 22.04 / 24.04 or Debian 12). For production workloads running multiple containers and databases, 2 vCPU and 4 GB RAM is recommended.",
    tag: "Infrastructure",
  },
  {
    question: "Can I deploy private GitHub repositories?",
    answer:
      "Yes. You can connect your GitHub account via our integrated GitHub App or webhook relay. VersionGate securely negotiates ephemeral installation tokens with GitHub to clone and pull private repositories during build time — no plaintext personal access tokens stored in your codebase or shell history.",
    tag: "Security",
  },
  {
    question: "Is VersionGate free and open source?",
    answer:
      "VersionGate is 100% open source under the permissive MIT license. All features — Blue/Green deployments, unlimited projects, PM2 engine, database studio, scheduled cron jobs, and telemetry — are completely free and self-contained with no paywalls or cloud phone-home telemetry.",
    tag: "Open Source",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = ["All", "Deployment", "Comparison", "Runtimes", "Reliability", "Databases", "Networking"];

  const filteredFaqs =
    activeTag === "All" ? FAQS : FAQS.filter((f) => f.tag === activeTag || activeTag === "All");

  return (
    <section id="faq" className="border-t border-neutral-800 bg-[#060606] py-24 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Frequently Asked Questions
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to know about VersionGate
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Direct answers on architecture, blue/green mechanics, container & PM2 runtimes, and self-hosting.
          </p>
        </div>

        {/* Filter Tags */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition ${
                activeTag === tag
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-neutral-900/80 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/60 transition-colors hover:border-neutral-700"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition sm:p-6"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-base font-semibold text-white sm:text-lg">
                    {faq.question}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden sm:inline-block rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                      {faq.tag}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-300 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    >
                      ↓
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-800/60 bg-neutral-900/20 px-5 pb-6 pt-4 sm:px-6">
                    <p className="font-sans text-sm leading-relaxed text-neutral-300 sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Help Callout */}
        <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <h3 className="text-base font-semibold text-white">Have more questions?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Explore our technical documentation or ask questions on our GitHub discussion board.
            </p>
          </div>
          <div className="mt-4 flex shrink-0 items-center justify-center gap-3 sm:mt-0">
            <a
              href="/docs"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 font-mono text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              Explore Docs
            </a>
            <a
              href="https://github.com/dineshkorukonda/VersionGate/issues"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-4 py-2 font-mono text-xs font-semibold text-black transition hover:bg-neutral-200"
            >
              GitHub Discussions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
