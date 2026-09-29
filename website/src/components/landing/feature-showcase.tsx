export function FeatureShowcase() {
  const features = [
    {
      title: "Blue/Green Zero Downtime",
      badge: "Zero Drops",
      description:
        "Every project environment receives two dedicated slots. VersionGate builds on the idle port, verifies health probes, then instantly repoints Nginx upstream with zero dropped connections.",
    },
    {
      title: "Docker & Bare-Metal PM2",
      badge: "Dual Engine",
      description:
        "Deploy containerized applications with Docker, or run processes directly on the host using PM2 for maximum performance and zero virtualization overhead.",
    },
    {
      title: "In-Browser Database Studio",
      badge: "One Click",
      description:
        "Provision PostgreSQL, Redis, MySQL, or MongoDB with persistent volumes. Inspect tables, run queries, and inject database credentials directly into your apps.",
    },
    {
      title: "Sub-2-Second Warm Rollback",
      badge: "Instant Recovery",
      description:
        "Standby slots and local image caches remain warm. If a bug reaches production, revert to the previous working version in under two seconds without waiting for a rebuild.",
    },
    {
      title: "Automated SSL & Domains",
      badge: "Auto Certbot",
      description:
        "Attach custom production hostnames with automated Let's Encrypt TLS certificates. Preflight DNS checks ensure records have propagated before certificates are issued.",
    },
    {
      title: "Git Push Auto-Deploy",
      badge: "Automated CI/CD",
      description:
        "Push a commit to GitHub and VersionGate takes care of the rest. Auto-detects frameworks (Next.js, Node, Bun, Python, Go, Rust), installs dependencies, and deploys.",
    },
  ];

  return (
    <section id="features" className="border-t border-neutral-200 bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
            Everything you need to ship, run, and scale on your own server.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600">
            No cloud markups, no per-seat fees, and no mystery black-boxes. Just reliable infrastructure primitives.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition hover:border-neutral-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-3 py-0.5 font-mono text-[10px] font-semibold text-neutral-800">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
