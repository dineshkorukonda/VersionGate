export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Push your code",
      description:
        "Push a commit to GitHub or trigger via API. VersionGate securely verifies the webhook signature and queues the build.",
    },
    {
      number: "02",
      title: "Build on an idle slot",
      description:
        "Your new version compiles and boots on a secondary internal port. Your active users experience zero interruption.",
    },
    {
      number: "03",
      title: "Automated health checks",
      description:
        "Probes test your application endpoints to ensure everything is responding with healthy 200 OK responses.",
    },
    {
      number: "04",
      title: "Zero-downtime cutover",
      description:
        "Nginx atomically repoints incoming traffic to the healthy slot. If health checks fail, the previous version keeps running.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-neutral-850 bg-[#020202] py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From Git push to live traffic in four simple steps.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            Every deployment is isolated, verified, and completely automated.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-6 transition hover:border-neutral-700"
            >
              <div>
                <span className="font-mono text-2xl font-bold text-neutral-600 block">
                  {step.number}
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
