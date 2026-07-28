"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CommandSearchModal } from "./command-search-modal";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "features" | "updates" | "architecture" | "docs" | "get-started" }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const link = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`font-sans text-xs tracking-wider transition ${
        active === key ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  const handleCopyInstall = () => {
    navigator.clipboard.writeText("npx versiongate init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-sans text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>VersionGate</span>
            </Link>

            <button
              onClick={handleCopyInstall}
              className="hidden lg:flex items-center gap-2 rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 font-mono text-[11px] text-zinc-300 hover:border-zinc-700 transition"
            >
              <span className="text-zinc-500">$</span>
              <span>npx versiongate init</span>
              <span className="text-emerald-400 text-[10px] ml-1">
                {copied ? "[ Copied ]" : "[ Copy ]"}
              </span>
            </button>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {link("/#capabilities", "Capabilities", "features")}
            {link("/#architecture", "Topology", "architecture")}
            {link("/#sandbox", "Sandbox", "updates")}
            {link("/#qna", "Q&A", "updates")}
            {link("/#calculator", "Calculator", "features")}
            {link("/docs", "Docs", "docs")}
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              title="Toggle Light/Dark Theme"
            >
              [ Theme: {theme === "dark" ? "Dark" : "Light"} ]
            </button>

            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-sans text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              <span>Search</span>
              <kbd className="rounded bg-black px-1.5 py-0.5 text-[10px] text-zinc-500 border border-zinc-800">
                ⌘K
              </kbd>
            </button>

            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded border border-zinc-700/80 bg-zinc-900/60 px-3 py-1.5 font-sans text-xs text-zinc-200 transition hover:bg-zinc-800 hover:text-white sm:inline-flex"
            >
              GitHub
            </Link>
            <Link
              href="/#get-started"
              className="rounded bg-white px-3.5 py-1.5 font-sans text-xs font-bold text-black transition hover:bg-zinc-200"
            >
              Deploy Now
            </Link>
          </div>
        </div>
      </header>

      <CommandSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
