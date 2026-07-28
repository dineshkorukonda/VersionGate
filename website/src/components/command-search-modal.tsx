"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SearchItem {
  id: string;
  category: "Command" | "Documentation" | "API Route" | "Architecture";
  title: string;
  description: string;
  href: string;
  snippet?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "cmd-deploy",
    category: "Command",
    title: "versiongate deploy",
    description: "Triggers a zero-downtime blue/green deployment for a project environment",
    href: "/docs/quick-start",
    snippet: "versiongate deploy --project api-backend --env production",
  },
  {
    id: "cmd-rollback",
    category: "Command",
    title: "versiongate rollback",
    description: "Performs instant zero-wait warm-swap rollback using local Docker images",
    href: "/docs/quick-start",
    snippet: "versiongate rollback --project api-backend --env production",
  },
  {
    id: "cmd-proxy",
    category: "Command",
    title: "versiongate proxy list",
    description: "Lists active Nginx stage path proxy routes for all project environments",
    href: "/docs/networking",
    snippet: "/p/:projectName/:envName",
  },
  {
    id: "api-tokens",
    category: "API Route",
    title: "POST /api/v1/auth/tokens",
    description: "Generates a persistent vg_live_... Bearer token for CI/CD pipelines",
    href: "/docs/api-reference",
    snippet: "Authorization: Bearer vg_live_...",
  },
  {
    id: "api-health",
    category: "API Route",
    title: "GET /api/v1/system/engine-health",
    description: "Fetches live PostgreSQL connection latency, Redis locks, and system alerts",
    href: "/docs/api-reference",
    snippet: "GET /api/v1/system/engine-health",
  },
  {
    id: "doc-arch",
    category: "Architecture",
    title: "Blue-Green Slot Orchestration",
    description: "How VersionGate allocates published port slots and atomically reloads Nginx upstreams",
    href: "/docs/architecture",
  },
  {
    id: "doc-networking",
    category: "Documentation",
    title: "Stage Path Reverse Proxy Configuration",
    description: "Configuring Nginx path-based routing for dev, staging, and production",
    href: "/docs/networking",
  },
  {
    id: "doc-quickstart",
    category: "Documentation",
    title: "5-Minute VPS Bootstrap Guide",
    description: "Complete guide to bootstrapping Docker, PostgreSQL, Redis, and VersionGate on Ubuntu/Debian",
    href: "/docs/quick-start",
  },
];

export function CommandSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === ""
    ? SEARCH_ITEMS
    : SEARCH_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden z-10">
        <div className="flex items-center border-b border-zinc-800 px-4 py-3 bg-black">
          <span className="font-mono text-xs text-zinc-500 mr-3">///</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, API endpoints, or architecture docs..."
            className="w-full bg-transparent font-mono text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-zinc-900">
          {filtered.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-zinc-500">
              No matching commands or documentation found for "{query}".
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full text-left p-3 rounded hover:bg-zinc-900 transition flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 font-bold border border-zinc-700">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-white group-hover:text-sky-300 transition">
                      {item.title}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-zinc-400">{item.description}</p>
                  {item.snippet && (
                    <p className="font-mono text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded inline-block">
                      {item.snippet}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] text-zinc-500 group-hover:text-white transition">
                  [ Select ]
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-zinc-800 px-4 py-2 bg-black flex items-center justify-between font-mono text-[10px] text-zinc-500">
          <span>Navigation: Up/Down Arrow or Click</span>
          <span>Shortcut: ⌘K</span>
        </div>
      </div>
    </div>
  );
}
