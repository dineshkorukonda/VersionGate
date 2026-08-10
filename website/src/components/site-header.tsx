"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CommandSearchModal } from "./command-search-modal";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "features" | "docs" }) {
  const [searchOpen, setSearchOpen] = useState(false);
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
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-[15px] font-bold tracking-tight text-foreground"
            >
              VersionGate
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/#capabilities"
                className={`text-xs transition ${
                  active === "features"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                href="/#architecture-loop"
                className="text-xs text-muted-foreground transition hover:text-foreground"
              >
                Architecture
              </Link>
              <Link
                href="/docs"
                className={`text-xs transition ${
                  active === "docs"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Docs
              </Link>
              <Link
                href="/changelog"
                className="text-xs text-muted-foreground transition hover:text-foreground"
              >
                Changelog
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <span>Search</span>
              <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground transition hover:bg-muted"
              title="Toggle Light/Dark Theme"
            >
              [ {theme === "dark" ? "Dark" : "Light"} ]
            </button>

            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 sm:inline-flex"
            >
              GitHub
            </Link>
          </div>
        </div>
      </header>

      <CommandSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
