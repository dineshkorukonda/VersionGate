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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md transition-colors [.light_&]:border-border [.light_&]:bg-background/85">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-white [.light_&]:text-foreground"
            >
              VersionGate
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/#capabilities"
                className={`font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                  active === "features"
                    ? "text-[#3effa8]"
                    : "text-white/50 hover:text-white [.light_&]:text-muted-foreground [.light_&]:hover:text-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                href="/#architecture-loop"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50 transition hover:text-white [.light_&]:text-muted-foreground [.light_&]:hover:text-foreground"
              >
                Architecture
              </Link>
              <Link
                href="/docs"
                className={`font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                  active === "docs"
                    ? "text-[#3effa8]"
                    : "text-white/50 hover:text-white [.light_&]:text-muted-foreground [.light_&]:hover:text-foreground"
                }`}
              >
                Docs
              </Link>
              <Link
                href="/changelog"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50 transition hover:text-white [.light_&]:text-muted-foreground [.light_&]:hover:text-foreground"
              >
                Changelog
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60 transition hover:border-white/30 hover:text-white [.light_&]:border-border [.light_&]:text-muted-foreground"
            >
              <span>Search</span>
              <kbd className="hidden border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline [.light_&]:border-border">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 transition hover:border-white/30 [.light_&]:border-border [.light_&]:text-foreground"
              title="Toggle Light/Dark Theme"
            >
              [ {theme === "dark" ? "Dark" : "Light"} ]
            </button>

            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="hidden bg-[#3effa8] px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition hover:brightness-110 sm:inline-flex"
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
