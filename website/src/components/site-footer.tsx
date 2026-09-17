"use client";

import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-black py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">VersionGate</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-primary">v2.9.5</span>
            </div>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Self-hosted zero-downtime Docker &amp; multi-runtime deployment engine with blue/green slot routing and built-in database studio.
            </p>
            <p className="text-[11px] text-zinc-500">
              MIT License &middot; Built by Dinesh Korukonda
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground uppercase tracking-wider">[ Product ]</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href="/#features" className="hover:text-primary transition">Features &amp; Bento Matrix</Link></li>
              <li><Link href="/#architecture" className="hover:text-primary transition">Zero-Downtime Pipeline</Link></li>
              <li><Link href="/#install" className="hover:text-primary transition">Installation Guide</Link></li>
              <li><Link href="/changelog" className="hover:text-primary transition">Release Changelog</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground uppercase tracking-wider">[ Documentation ]</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href="/docs/quick-start" className="hover:text-primary transition">Quick-Start Guide</Link></li>
              <li><Link href="/docs/architecture" className="hover:text-primary transition">Engine Architecture</Link></li>
              <li><Link href="/docs/api-reference" className="hover:text-primary transition">HTTP API Reference</Link></li>
              <li><Link href="/docs/troubleshooting" className="hover:text-primary transition">DNS Troubleshooting</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground uppercase tracking-wider">[ Open Source ]</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-primary transition">GitHub Repository</Link></li>
              <li><Link href={`${GITHUB_REPO}/issues`} target="_blank" rel="noreferrer" className="hover:text-primary transition">Issue Tracker</Link></li>
              <li><Link href={`${GITHUB_REPO}/discussions`} target="_blank" rel="noreferrer" className="hover:text-primary transition">Discussions</Link></li>
              <li><Link href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-primary transition">MIT License</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 font-mono text-[11px] text-zinc-500">
          <p>&copy; {new Date().getFullYear()} VersionGate. Self-hosted and sovereign.</p>
          <p className="mt-2 sm:mt-0">Zero telemetry tracking &middot; Total data privacy</p>
        </div>
      </div>
    </footer>
  );
}
