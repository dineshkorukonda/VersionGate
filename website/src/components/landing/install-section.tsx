"use client";

import { useState } from "react";

const SCRIPT_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";
const DOCKER_CMD =
  "docker run -d --name versiongate -p 9090:9090 -v /var/run/docker.sock:/var/run/docker.sock versiongate/engine:latest";

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
    <section id="install" className="border-t border-neutral-800 py-20 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Install</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Run VersionGate on your VPS
          </h2>
          <p className="mt-4 text-neutral-400">
            Ubuntu 22.04+ or Debian 12 with Docker, PostgreSQL, and Nginx.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setTab("script")}
              className={`rounded-md px-3 py-1.5 transition ${
                tab === "script"
                  ? "bg-primary font-medium text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Install script
            </button>
            <button
              type="button"
              onClick={() => setTab("docker")}
              className={`rounded-md px-3 py-1.5 transition ${
                tab === "docker"
                  ? "bg-primary font-medium text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Docker
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-[#0a0a0a] p-4">
            <code className="overflow-x-auto font-mono text-xs text-neutral-300">{cmd}</code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
