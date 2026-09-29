import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight text-neutral-900">
              <span className="inline-block h-3.5 w-3.5 rounded-sm bg-neutral-900" />
              <span>
                Version<span className="font-normal text-neutral-500">Gate</span>
              </span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              Self-hosted zero-downtime deployment engine for Docker and PM2 on your own VPS.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-neutral-900">Product</p>
              <ul className="space-y-1.5 text-neutral-600">
                <li><Link href="/#features" className="hover:text-neutral-950 transition">Features</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-neutral-950 transition">How it works</Link></li>
                <li><Link href="/#faq" className="hover:text-neutral-950 transition">FAQ</Link></li>
                <li><Link href="/#install" className="hover:text-neutral-950 transition">Install</Link></li>
                <li><Link href="/changelog" className="hover:text-neutral-950 transition">Changelog</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-neutral-900">Docs</p>
              <ul className="space-y-1.5 text-neutral-600">
                <li><Link href="/docs/quick-start" className="hover:text-neutral-950 transition">Quick start</Link></li>
                <li><Link href="/docs/api-reference" className="hover:text-neutral-950 transition">API reference</Link></li>
                <li><Link href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-neutral-950 transition">GitHub</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-neutral-400 font-mono">
          &copy; {new Date().getFullYear()} VersionGate · MIT License
        </p>
      </div>
    </footer>
  );
}
