"use client";

import Link from "next/link";
import { useState } from "react";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#architecture", label: "How it works" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#install", label: "Install" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: GITHUB_REPO, label: "GitHub", external: true },
] as const;

export function MobileSiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-site-nav-panel"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition hover:border-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-site-nav-panel"
          className="absolute left-0 right-0 top-14 z-50 border-b border-neutral-800 bg-black/95 px-4 py-4 shadow-2xl backdrop-blur-md"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={"external" in link ? "_blank" : undefined}
                rel={"external" in link ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
