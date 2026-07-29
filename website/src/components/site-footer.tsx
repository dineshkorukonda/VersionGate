import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
  { label: "API Reference", href: "/docs/api-reference" },
  { label: "GitHub Repository", href: GITHUB_REPO },
  { label: "Issues & Support", href: `${GITHUB_REPO}/issues` },
  { label: "MIT License", href: `${GITHUB_REPO}/blob/main/LICENSE` },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-12 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-sans text-xs text-foreground font-bold">
            VersionGate Engine // Zero-Downtime Docker Deploys
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Dinesh Korukonda · MIT Licensed
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-sans text-xs text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
