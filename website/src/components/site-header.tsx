import Link from "next/link";
import { LogoMark } from "./logo";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

export function SiteHeader({ active }: { active?: "features" | "pricing" | "docs" }) {
  const link = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active === key
          ? "text-primary underline decoration-2 underline-offset-8"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Version<span className="text-primary">Gate</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {link("/#features", "Features", "features")}
          {link("/#pricing", "Pricing", "pricing")}
          {link("/docs", "Docs", "docs")}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href={GITHUB_REPO}
            className="hidden rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
          >
            Log In
          </Link>
          <Link
            href={GITHUB_REPO}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
