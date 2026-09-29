"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does zero-downtime deployment work on a single server?",
    answer:
      "Every production environment is allocated two dedicated internal ports (Slot A and Slot B). When you push code, VersionGate builds and boots the new version on the idle slot while the active slot continues serving live traffic. Once the new slot passes automated HTTP health checks, VersionGate atomically reloads Nginx upstream. Active TCP connections complete gracefully and new requests immediately hit the healthy slot — resulting in zero dropped requests and zero downtime.",
  },
  {
    question: "What are the minimum server requirements?",
    answer:
      "VersionGate runs comfortably on any $5/month Linux VPS (1 vCPU, 1 GB RAM) running Ubuntu 22.04+ or Debian 12. For larger production workloads running multiple Docker containers and databases, 2 vCPU and 4 GB RAM is recommended.",
  },
  {
    question: "How is VersionGate different from Vercel or Coolify?",
    answer:
      "Unlike cloud PaaS platforms like Vercel, VersionGate is 100% self-hosted on your own hardware with no per-seat fees or resource markups. Compared to standard Docker Compose redeploys which briefly stop containers, VersionGate implements true isolated Blue/Green slot switching at the Nginx layer and native bare-metal PM2 process supervision alongside Docker.",
  },
  {
    question: "Can I run applications with PM2 without Docker?",
    answer:
      "Yes. VersionGate includes dual deployment engines: Docker containers and bare-metal PM2 host supervision. For Node.js, Python, or Go microservices where container virtualization overhead is undesirable, VersionGate runs processes directly on the host with PM2 while maintaining identical zero-downtime guarantees.",
  },
  {
    question: "How do instant warm rollbacks work?",
    answer:
      "VersionGate retains the local Docker image and configuration of your previous successful deployment in a warm cache. If an issue occurs in production, clicking Rollback bypasses git pulls, dependency installs, and builds, restoring the previous working version in under two seconds.",
  },
  {
    question: "Is VersionGate free and open source?",
    answer:
      "Yes, VersionGate is 100% open source under the permissive MIT license. All features — Blue/Green deployments, unlimited projects, PM2 engine, database studio, and telemetry — are completely free and self-contained with no paywalls.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-neutral-200 bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Frequently Asked Questions
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
            Everything you need to know
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-600">
            Direct answers on architecture, zero-downtime deployments, and self-hosting.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition sm:p-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-neutral-950">
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-xs font-mono text-neutral-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-neutral-950" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-150 bg-neutral-50/70 px-5 pb-6 pt-4 sm:px-6">
                    <p className="text-sm leading-relaxed text-neutral-600">
                      {faq.answer}
                    </p>
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
