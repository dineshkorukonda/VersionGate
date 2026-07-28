import Link from "next/link";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "API Reference", href: "/docs/api-reference" },
  { label: "GitHub Repository", href: GITHUB_REPO },
  { label: "Issues & Support", href: `${GITHUB_REPO}/issues` },
  { label: "MIT License", href: `${GITHUB_REPO}/blob/main/LICENSE` },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-black py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs text-white font-bold">
            VersionGate Engine // Zero-Downtime Docker Deploys
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            © {new Date().getFullYear()} Dinesh Korukonda · MIT Licensed
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-mono text-xs text-zinc-400 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
