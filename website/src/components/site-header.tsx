import Link from "next/link";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

export function SiteHeader({ active }: { active?: "features" | "architecture" | "docs" | "get-started" }) {
  const link = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`font-mono text-[11px] lowercase tracking-wide transition ${
        active === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          VersionGate
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {link("/#features", "features", "features")}
          {link("/#architecture", "architecture", "architecture")}
          {link("/docs", "docs", "docs")}
          {link("/#get-started", "get started", "get-started")}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={GITHUB_REPO}
            className="hidden border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition hover:bg-muted sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/#get-started"
            className="bg-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
