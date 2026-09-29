"use client";

import { useState } from "react";
import Link from "next/link";

const SCRIPT_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";
const DOCKER_CMD =
  "docker run -d --name versiongate -p 9090:9090 -v /var/run/docker.sock:/var/run/docker.sock versiongate/engine:latest";

export function InstallSection() {
  const [tab, setTab] = useState<"script" | "docker">("script");
  const [copied, setCopied] = useState(false);

  const cmd = tab === "script" ? SCRIPT_CMD : DOCKER_CMD;
  const panelId = tab === "script" ? "install-script-panel" : "install-docker-panel";

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="border-t border-neutral-850 bg-[#020202] py-20 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Installation
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Run VersionGate on your server
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-400">
            Compatible with Ubuntu 22.04+ or Debian 12. Installs in less than 2 minutes.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
          <div role="tablist" aria-label="Install method" className="flex gap-2 text-xs font-mono">
            <button
              type="button"
              role="tab"
              id="install-script-tab"
              aria-selected={tab === "script"}
              aria-controls={panelId}
              onClick={() => setTab("script")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                tab === "script"
                  ? "bg-white text-black font-semibold"
                  : "border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Install Script (Recommended)
            </button>
            <button
              type="button"
              role="tab"
              id="install-docker-tab"
              aria-selected={tab === "docker"}
              aria-controls={panelId}
              onClick={() => setTab("docker")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                tab === "docker"
                  ? "bg-white text-black font-semibold"
                  : "border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Docker
            </button>
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tab === "script" ? "install-script-tab" : "install-docker-tab"}
            className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-black p-4"
          >
            <code className="overflow-x-auto font-mono text-xs text-neutral-300">{cmd}</code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-lg bg-neutral-800 px-3 py-1.5 font-mono text-xs text-white transition hover:bg-neutral-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-850 pt-4 text-xs text-neutral-400">
            <span>Requires: Docker, PostgreSQL 16, Nginx</span>
            <Link href="/docs/quick-start" className="text-white hover:underline">
              Read Quick Start Guide →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
