import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-black py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">VersionGate</span>
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-primary">v2.9.5</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Self-hosted zero-downtime Docker and multi-runtime deployment engine with blue/green slot routing and built-in database studio.
            </p>
            <p className="text-[11px] text-zinc-500">
              MIT License · Built by Dinesh Korukonda
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Product</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href="/#features" className="hover:text-primary transition">Features</Link></li>
              <li><Link href="/#architecture" className="hover:text-primary transition">Architecture</Link></li>
              <li><Link href="/#install" className="hover:text-primary transition">Installation</Link></li>
              <li><Link href="/changelog" className="hover:text-primary transition">Changelog</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Documentation</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href="/docs/quick-start" className="hover:text-primary transition">Quick Start</Link></li>
              <li><Link href="/docs/architecture" className="hover:text-primary transition">Engine Architecture</Link></li>
              <li><Link href="/docs/api-reference" className="hover:text-primary transition">API Reference</Link></li>
              <li><Link href="/docs/troubleshooting" className="hover:text-primary transition">Troubleshooting</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Open Source</p>
            <ul className="space-y-1.5 text-zinc-400">
              <li><Link href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-primary transition">GitHub</Link></li>
              <li><Link href={`${GITHUB_REPO}/issues`} target="_blank" rel="noreferrer" className="hover:text-primary transition">Issues</Link></li>
              <li><Link href={`${GITHUB_REPO}/discussions`} target="_blank" rel="noreferrer" className="hover:text-primary transition">Discussions</Link></li>
              <li><Link href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-primary transition">License</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 text-[11px] text-zinc-500">
          <p>&copy; {new Date().getFullYear()} VersionGate. Self-hosted and sovereign.</p>
          <p className="mt-2 sm:mt-0">Zero telemetry · Total data privacy</p>
        </div>
      </div>
    </footer>
  );
}
