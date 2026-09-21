import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">VersionGate</p>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              Self-hosted zero-downtime deployment engine for Docker and PM2 on your own VPS.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-white">Product</p>
              <ul className="space-y-1.5 text-neutral-500">
                <li><Link href="/#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/#architecture" className="hover:text-white transition">How it works</Link></li>
                <li><Link href="/#install" className="hover:text-white transition">Install</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition">Changelog</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-white">Docs</p>
              <ul className="space-y-1.5 text-neutral-500">
                <li><Link href="/docs/quick-start" className="hover:text-white transition">Quick start</Link></li>
                <li><Link href="/docs/api-reference" className="hover:text-white transition">API reference</Link></li>
                <li><Link href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} VersionGate · MIT License
        </p>
      </div>
    </footer>
  );
}
