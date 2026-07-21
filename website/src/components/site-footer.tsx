import Link from "next/link";
import { LogoMark } from "./logo";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Quick Start", href: "/docs/quick-start" },
      { label: "GitHub", href: GITHUB_REPO },
      { label: "Issues", href: `${GITHUB_REPO}/issues` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "MIT License", href: `${GITHUB_REPO}/blob/main/LICENSE` },
      { label: "Source Code", href: GITHUB_REPO },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="text-lg font-bold tracking-tight">
              Version<span className="text-primary">Gate</span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Self-hosted deployments for modern engineering teams. Zero downtime, total control.
          </p>
          <p className="pt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} VersionGate. Built for high-availability.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{col.heading}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
