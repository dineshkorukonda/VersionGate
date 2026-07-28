import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "features" | "updates" | "architecture" | "docs" | "get-started" }) {
  const link = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`font-mono text-xs tracking-wider transition ${
        active === key ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-mono text-base font-extrabold tracking-tight text-white">
            VersionGate
          </Link>
          <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-[9px] text-zinc-400 border border-zinc-700/50">
            v1.4 Engine
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {link("/#updates", "Updates", "updates")}
          {link("/#features", "Features", "features")}
          {link("/#architecture", "Architecture", "architecture")}
          {link("/docs", "Docs", "docs")}
          {link("/#get-started", "Get Started", "get-started")}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded border border-zinc-700/80 bg-zinc-900/60 px-3.5 py-1.5 font-mono text-xs text-zinc-200 transition hover:bg-zinc-800 hover:text-white sm:inline-flex"
          >
            GitHub
          </Link>
          <Link
            href="/#get-started"
            className="rounded bg-white px-4 py-1.5 font-mono text-xs font-bold text-black transition hover:bg-zinc-200"
          >
            Deploy Now
          </Link>
        </div>
      </div>
    </header>
  );
}
