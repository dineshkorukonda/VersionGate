import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteHeader({ active }: { active?: "docs" | "changelog" } = {}) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-white">
            VersionGate
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/#features" className="text-neutral-400 transition hover:text-white">
              Features
            </Link>
            <Link href="/#architecture" className="text-neutral-400 transition hover:text-white">
              How it works
            </Link>
            <Link href="/#install" className="text-neutral-400 transition hover:text-white">
              Install
            </Link>
            <Link
              href="/docs"
              className={active === "docs" ? "text-white font-medium" : "text-neutral-400 hover:text-white transition"}
            >
              Docs
            </Link>
            <Link
              href="/changelog"
              className={active === "changelog" ? "text-white font-medium" : "text-neutral-400 hover:text-white transition"}
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
            className="hidden sm:inline-flex text-sm text-neutral-400 transition hover:text-white"
          >
            GitHub
          </Link>
          <Link
            href="#install"
            className="inline-flex h-8 items-center rounded-lg bg-white px-3.5 text-xs font-semibold text-black transition hover:bg-neutral-200"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
