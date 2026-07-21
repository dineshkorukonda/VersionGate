import Link from "next/link";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

const LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "API Reference", href: "/docs/api-reference" },
  { label: "GitHub", href: GITHUB_REPO },
  { label: "Support", href: `${GITHUB_REPO}/issues` },
  { label: "MIT License", href: `${GITHUB_REPO}/blob/main/LICENSE` },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} VersionGate Terminal
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
