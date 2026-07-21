import Link from "next/link";

export function Breadcrumb({ page }: { page: string }) {
  return (
    <div className="mb-4 flex items-center gap-1.5 text-sm">
      <Link href="/docs" className="text-muted-foreground transition hover:text-primary">
        Docs
      </Link>
      <span className="text-muted-foreground">›</span>
      <span className="font-medium text-primary">{page}</span>
    </div>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>;
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-relaxed text-muted-foreground">{children}</p>;
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 mb-4 scroll-mt-24 text-2xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{children}</p>;
}

export function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-border">
      {title && (
        <div className="border-b border-white/10 bg-navy px-4 py-2 font-mono text-[11px] text-white/50">{title}</div>
      )}
      <pre className="overflow-x-auto bg-terminal p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
        {children}
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[12px] font-medium text-primary">
      {children}
    </code>
  );
}

export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-r-xl border-l-4 border-primary bg-primary-soft/50 p-5">
      <div className="mb-1.5 text-sm font-semibold text-primary">{title}</div>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="my-6 grid gap-4 sm:grid-cols-3">{children}</div>;
}

export function StepCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-primary">
        {step}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function NextLinks({
  primary,
  secondary,
}: {
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <Link
        href={primary.href}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {primary.label}
        <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex items-center rounded-full bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft/70"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j < 2 ? "font-mono text-xs" : "text-xs text-muted-foreground"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
