const STEPS = [
  {
    step: "1",
    title: "Connect your repo",
    description: "Link GitHub or paste a repo URL. VersionGate detects your stack and configures build settings.",
  },
  {
    step: "2",
    title: "Push to deploy",
    description: "Webhooks enqueue a deploy job. The engine builds, starts the new slot, and waits for health checks.",
  },
  {
    step: "3",
    title: "Traffic switches atomically",
    description: "Nginx upstream reloads to the healthy slot. Roll back instantly if something goes wrong.",
  },
];

export function HowItWorks() {
  return (
    <section id="architecture" className="border-t border-neutral-800 bg-neutral-950 py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From git push to live traffic
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-6"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
