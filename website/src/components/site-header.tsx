import Link from "next/link";
import { MobileSiteNav } from "@/components/mobile-site-nav";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-850 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded"
          >
            <span className="inline-block h-4 w-4 bg-white" />
            VersionGate
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/#features"
              className="text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
            >
              Features
            </Link>
            <Link
              href="/#architecture"
              className="text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
            >
              How it works
            </Link>
            <Link
              href="/#capabilities"
              className="text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
            >
              Capabilities
            </Link>
            <Link
              href="/#faq"
              className="text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
            >
              FAQ
            </Link>
            <Link
              href="/#install"
              className="text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
            >
              Install
            </Link>
            <Link
              href="/docs"
              className={`transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
                active === "docs" ? "text-white font-medium" : "text-neutral-400"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/changelog"
              className={`transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
                active === "changelog" ? "text-white font-medium" : "text-neutral-400"
              }`}
            >
              Changelog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/dineshkorukonda/VersionGate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-neutral-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            GitHub
          </Link>
          <Link
            href="/#install"
            className="inline-flex h-8 items-center rounded-lg bg-white px-3.5 text-xs font-semibold text-black transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            Get started
          </Link>
          <MobileSiteNav />
        </div>
      </div>
    </header>
  );
}
