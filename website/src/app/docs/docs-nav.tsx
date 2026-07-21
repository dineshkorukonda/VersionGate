"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/docs",
    label: "Introduction",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/docs/quick-start",
    label: "Quick Start",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/docs/architecture",
    label: "Architecture",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/docs/deployment",
    label: "Deployment",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/docs/networking",
    label: "Networking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9z" />
      </svg>
    ),
  },
  {
    href: "/docs/api-reference",
    label: "API Reference",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7">
        <path d="M8 9l-3 3 3 3m8-6 3 3-3 3M13 6l-2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
