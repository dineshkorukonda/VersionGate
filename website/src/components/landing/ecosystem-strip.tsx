"use client";

interface TechItem {
  name: string;
  category: string;
  badge: string;
}

const TECH_STACK: TechItem[] = [
  { name: "Docker", category: "Engine", badge: "Container" },
  { name: "Node.js", category: "Runtime", badge: "Runtime" },
  { name: "Bun", category: "Runtime", badge: "Fast Runtime" },
  { name: "PM2", category: "Process", badge: "Bare-Metal" },
  { name: "Python / uv", category: "Runtime", badge: "FastAPI / Django" },
  { name: "Rust / Cargo", category: "Compiled", badge: "Native Binary" },
  { name: "Go", category: "Compiled", badge: "Native Binary" },
  { name: "Next.js / Vite", category: "Frontend", badge: "SPA / SSR" },
  { name: "PostgreSQL", category: "Database", badge: "Postgres 16" },
  { name: "Redis", category: "Database", badge: "Cache & Pub/Sub" },
  { name: "MySQL / MariaDB", category: "Database", badge: "Relational" },
  { name: "MongoDB", category: "Database", badge: "Document" },
  { name: "Nginx", category: "Proxy", badge: "Reverse Proxy" },
  { name: "Let's Encrypt", category: "Security", badge: "Certbot TLS" },
];

export function EcosystemStrip() {
  return (
    <section className="border-y border-border/40 bg-zinc-950/40 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="shrink-0 text-center md:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              [ SUPPORTED RUNTIMES & ENGINES ]
            </p>
            <h3 className="mt-1 font-mono text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Deploy any framework, database, or binary
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="group flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-1.5 font-mono text-xs transition-all hover:border-primary/50 hover:bg-background"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 transition-transform group-hover:scale-125" />
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
