import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "docs" | "changelog" } = {}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-base font-semibold tracking-tight text-foreground">
              VersionGate
            </span>
            <span className="rounded-md border border-border/80 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              v2.9.5
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link
              href="/#features"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/#architecture"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Architecture
            </Link>
            <Link
              href="/#install"
              className="text-muted-foreground transition hover:text-foreground"
            >
              Install
            </Link>
            <Link
              href="/docs"
              className={`transition ${
                active === "docs"
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/changelog"
              className={`transition ${
                active === "changelog"
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Changelog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-border/80 bg-zinc-900 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/60"
          >
            Star on GitHub
          </Link>

          <Link
            href="/docs/quick-start"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Deploy
          </Link>
        </div>
      </div>
    </header>
  );
}
