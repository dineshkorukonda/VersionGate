"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/docs", label: "Introduction" },
  { href: "/docs/quick-start", label: "Quick Start" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "/docs/deployment", label: "Deployment" },
  { href: "/docs/networking", label: "Networking" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
  { href: "/docs/api-reference", label: "API Reference" },
] as const;

export function DocsMobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-md lg:hidden">
      <label htmlFor="docs-mobile-nav-select" className="sr-only">
        Documentation section
      </label>
      <select
        id="docs-mobile-nav-select"
        value={pathname}
        onChange={(e) => {
          window.location.href = e.target.value;
        }}
        className="w-full appearance-none border-0 bg-transparent px-4 py-3 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500"
      >
        {ITEMS.map((item) => (
          <option key={item.href} value={item.href}>
            {item.label}
          </option>
        ))}
      </select>
      <nav aria-label="Documentation sections" className="flex gap-1 overflow-x-auto px-4 pb-3">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
                active
                  ? "border-white bg-zinc-900 text-white"
                  : "border-border text-muted-foreground hover:border-zinc-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
