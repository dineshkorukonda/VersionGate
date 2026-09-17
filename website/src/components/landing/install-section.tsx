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
    <section id="install" className="py-20 border-t border-border/40 bg-zinc-950/80 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ GET STARTED IN SECONDS ]
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Install VersionGate on Your Server
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Run the single-command bootstrap script on any Ubuntu/Debian VPS, or execute via Docker container.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-border/70 bg-black p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setTab("script")}
                className={`rounded px-3 py-1.5 transition ${
                  tab === "script"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                [ One-Line Script ]
              </button>
              <button
                type="button"
                onClick={() => setTab("docker")}
                className={`rounded px-3 py-1.5 transition ${
                  tab === "docker"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                [ Docker Container ]
              </button>
            </div>

            <span className="font-mono text-xs text-zinc-400">[ Host Requirements: Ubuntu 22.04+ / Debian 12 ]</span>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-border/60 bg-zinc-950 p-4 font-mono text-xs text-zinc-200">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-primary select-none">$</span>
              <code className="whitespace-nowrap">{cmd}</code>
            </div>
            <button
              type="button"
              onClick={copy}
              className="ml-4 shrink-0 rounded bg-zinc-800 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-200 hover:bg-primary hover:text-primary-foreground transition"
            >
              {copied ? "[ COPIED ]" : "[ COPY COMMAND ]"}
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 font-mono text-xs text-zinc-400">
            <div className="rounded border border-border/40 bg-zinc-900/30 p-3">
              <p className="font-semibold text-foreground">[ 01 // Automated Setup ]</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Installs Docker, PostgreSQL 16, Redis, Nginx reverse proxy, and PM2 system service.
              </p>
            </div>
            <div className="rounded border border-border/40 bg-zinc-900/30 p-3">
              <p className="font-semibold text-foreground">[ 02 // Admin Account ]</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Prompts for initial admin credentials and securely encrypts tokens with AES-256.
              </p>
            </div>
            <div className="rounded border border-border/40 bg-zinc-900/30 p-3">
              <p className="font-semibold text-foreground">[ 03 // Production Ready ]</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Opens dashboard on port 9090 with Certbot TLS auto-configuration ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
