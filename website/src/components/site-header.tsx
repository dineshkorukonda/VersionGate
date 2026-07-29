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
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-sans text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>VersionGate</span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/#capabilities"
                className={`font-sans text-xs transition ${
                  active === "features" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                href="/docs"
                className={`font-sans text-xs transition ${
                  active === "docs" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Docs
              </Link>
              <Link
                href="/changelog"
                className="font-sans text-xs text-muted-foreground hover:text-foreground transition"
              >
                Changelog
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-sans text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <span>Search</span>
              <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="rounded-md border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground hover:bg-muted transition"
              title="Toggle Light/Dark Theme"
            >
              [ {theme === "dark" ? "Dark" : "Light"} ]
            </button>

            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md border border-border bg-muted/50 px-3.5 py-1.5 font-sans text-xs text-foreground transition hover:bg-muted sm:inline-flex"
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
