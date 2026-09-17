interface TechItem {
  name: string;
  badge: string;
}

const TECH_STACK: TechItem[] = [
  { name: "Docker", badge: "Container" },
  { name: "Node.js", badge: "Runtime" },
  { name: "Bun", badge: "Runtime" },
  { name: "PM2", badge: "Bare-Metal" },
  { name: "Python / uv", badge: "FastAPI" },
  { name: "Rust / Cargo", badge: "Native" },
  { name: "Go", badge: "Native" },
  { name: "Next.js / Vite", badge: "Frontend" },
  { name: "PostgreSQL", badge: "Database" },
  { name: "Redis", badge: "Cache" },
  { name: "MySQL", badge: "Relational" },
  { name: "MongoDB", badge: "Document" },
  { name: "Nginx", badge: "Proxy" },
  { name: "Let's Encrypt", badge: "TLS" },
  { name: "Cron", badge: "Automation" },
];

export function EcosystemStrip() {
  return (
    <section className="border-y border-border/40 bg-zinc-950 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="shrink-0 text-center md:text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Supported runtimes
            </p>
            <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">
              Deploy any framework, database, or binary
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-zinc-900/80 px-3 py-1.5 text-xs transition hover:border-primary/40"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span className="font-medium text-foreground">{tech.name}</span>
                <span className="text-[10px] text-muted-foreground">{tech.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
