import Link from "next/link";
import { MobileSiteNav } from "@/components/mobile-site-nav";

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-full border border-neutral-200/90 bg-white/90 px-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md pointer-events-auto transition-all">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-full"
          >
            <span className="inline-block h-3.5 w-3.5 rounded-sm bg-neutral-900" />
            <span>
              Version<span className="font-normal text-neutral-500">Gate</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
            <Link
              href="/#features"
              className="text-neutral-600 transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-neutral-600 transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              How it works
            </Link>
            <Link
              href="/#faq"
              className="text-neutral-600 transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              FAQ
            </Link>
            <Link
              href="/docs"
              className={`transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                active === "docs" ? "text-neutral-950 font-semibold" : "text-neutral-600"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/changelog"
              className={`transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                active === "changelog" ? "text-neutral-950 font-semibold" : "text-neutral-600"
              }`}
            >
              Changelog
            </Link>
          </nav>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/dineshkorukonda/VersionGate"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-xs font-mono text-neutral-500 transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            GitHub
          </Link>
          <Link
            href="/#install"
            className="inline-flex h-7 items-center rounded-full bg-neutral-950 px-3.5 text-xs font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 shadow-sm"
          >
            Get started
          </Link>
          <MobileSiteNav />
        </div>
      </div>
    </header>
  );
}
