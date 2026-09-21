const DEPLOYMENTS = [
  {
    message: "feat: add deployment logs UI",
    project: "versiongate-api",
    author: "dineshkorukonda",
    status: "Ready",
    statusBadge: "[ READY ]",
    statusColor: "bg-emerald-500",
    env: "Production",
    envStyle: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    hash: "478f4da",
    branch: "main",
    time: "2m ago",
    duration: "48s",
  },
  {
    message: "fix: nginx upstream reload timing",
    project: "analytics-worker",
    author: "dineshkorukonda",
    status: "Ready",
    statusBadge: "[ READY ]",
    statusColor: "bg-emerald-500",
    env: "Production",
    envStyle: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    hash: "a91c2e1",
    branch: "main",
    time: "18m ago",
    duration: "1m 12s",
  },
  {
    message: "chore: bump dashboard dependencies",
    project: "web-portal",
    author: "dineshkorukonda",
    status: "Building",
    statusBadge: "[ BUILDING ]",
    statusColor: "bg-amber-400 motion-reduce:animate-none animate-pulse",
    env: "Preview",
    envStyle: "border-neutral-700 bg-neutral-900 text-neutral-400",
    hash: "b3f88ac",
    branch: "feat/ui-refresh",
    time: "Just now",
    duration: "—",
  },
];

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-60 blur-2xl motion-reduce:opacity-30" />
      <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-card shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
            <span className="ml-2 text-xs text-neutral-500">versiongate.tech/deployments</span>
          </div>
          <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-semibold text-black">
            Add New
          </span>
        </div>

        <div className="border-b border-neutral-800 px-4 py-4">
          <h3 className="text-sm font-semibold text-white">Deployments</h3>
          <p className="mt-0.5 text-xs text-neutral-400">All deployment records across your workspace</p>
        </div>

        <div className="divide-y divide-neutral-800">
          {DEPLOYMENTS.map((row) => (
            <div
              key={row.hash}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{row.message}</p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {row.project} · {row.author}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${row.statusColor}`} />
                  <span className="rounded border border-neutral-700 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                    {row.statusBadge}
                  </span>
                  <span className="text-neutral-600">{row.duration}</span>
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${row.envStyle}`}>
                  {row.env}
                </span>
                <span className="hidden font-mono text-neutral-500 sm:inline">{row.hash}</span>
                <span className="hidden font-mono text-neutral-500 sm:inline">#{row.branch}</span>
                <span className="text-neutral-500">{row.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
