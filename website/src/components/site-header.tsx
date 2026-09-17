"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "docs" | "changelog" } = {}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.className = initial;
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.className = nextTheme;
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-mono text-base font-bold tracking-tight text-foreground">
              VersionGate
            </span>
            <span className="rounded border border-border/80 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              v2.9.5
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 font-mono text-xs">
            <Link
              href="/#features"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/#architecture"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Architecture
            </Link>
            <Link
              href="/#install"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Install
            </Link>
            <Link
              href="/docs"
              className={`transition ${
                active === "docs"
                  ? "text-primary font-semibold underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/changelog"
              className={`transition ${
                active === "changelog"
                  ? "text-primary font-semibold underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Changelog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-zinc-900/60 px-3 py-1 font-mono text-xs text-foreground transition hover:border-primary/60 hover:bg-zinc-900"
          >
            <span className="text-amber-400 font-bold">&starf;</span>
            <span>Star on GitHub</span>
          </Link>

          <Link
            href="/docs/quick-start"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            [ Deploy ]
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded border border-border/80 px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:text-foreground hover:border-foreground"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
