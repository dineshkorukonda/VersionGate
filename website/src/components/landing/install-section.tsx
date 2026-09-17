"use client";

import { useState } from "react";

const SCRIPT_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";
const DOCKER_CMD = "docker run -d --name versiongate -p 9090:9090 -v /var/run/docker.sock:/var/run/docker.sock versiongate/engine:latest";

export function InstallSection() {
  const [tab, setTab] = useState<"script" | "docker">("script");
  const [copied, setCopied] = useState(false);

  const cmd = tab === "script" ? SCRIPT_CMD : DOCKER_CMD;

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="py-20 border-t border-border/40 bg-zinc-950 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Get started</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Install VersionGate on your server
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Run the bootstrap script on Ubuntu or Debian, or start via Docker container.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-border/60 bg-zinc-900 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setTab("script")}
                className={`rounded-md px-3 py-1.5 transition ${
                  tab === "script"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                One-line script
              </button>
              <button
                type="button"
                onClick={() => setTab("docker")}
                className={`rounded-md px-3 py-1.5 transition ${
                  tab === "docker"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Docker container
              </button>
            </div>
            <span className="text-xs text-zinc-400">Ubuntu 22.04+ or Debian 12</span>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-border/60 bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-primary select-none">$</span>
              <code className="whitespace-nowrap">{cmd}</code>
            </div>
            <button
              type="button"
              onClick={copy}
              className="ml-4 shrink-0 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-primary hover:text-primary-foreground transition"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-xs text-zinc-400">
            <div className="rounded-lg border border-border/40 bg-zinc-950 p-3">
              <p className="font-medium text-foreground">Automated setup</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Installs Docker, PostgreSQL 16, Redis, Nginx, and PM2.
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-zinc-950 p-3">
              <p className="font-medium text-foreground">Admin account</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Prompts for credentials and encrypts tokens with AES-256.
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-zinc-950 p-3">
              <p className="font-medium text-foreground">Production ready</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Dashboard on port 9090 with Certbot TLS configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
