"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ChangelogReleaseItem {
  title: string;
  description: string;
  command?: string;
  prLink?: string;
  prNumber?: number;
}

export interface ChangelogReleaseCategory {
  title: string;
  badge: "NEW" | "IMPROVEMENT" | "FIX";
  items: ChangelogReleaseItem[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  isLatest?: boolean;
  summary: string;
  categories: ChangelogReleaseCategory[];
  url?: string;
}

function slugVersion(version: string) {
  return version.replace(/[^a-zA-Z0-9]/g, "-");
}

export function ChangelogTimeline({ releases }: { releases: ChangelogRelease[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = releases.find((r) => r.isLatest) ?? releases[0];
    return new Set(initial ? [initial.version] : []);
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return releases;
    return releases.filter((rel) => {
      const haystack = [
        rel.version,
        rel.summary,
        ...rel.categories.flatMap((cat) => [
          cat.title,
          ...cat.items.flatMap((item) => [item.title, item.description, item.command ?? ""]),
        ]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [releases, query]);

  const toggle = (version: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  return (
    <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="lg:sticky lg:top-24 lg:w-48 lg:shrink-0">
        <label htmlFor="changelog-search" className="sr-only">
          Search changelog
        </label>
        <input
          id="changelog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search releases..."
          className="mb-4 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <nav aria-label="Release versions" className="hidden max-h-[70vh] overflow-y-auto lg:block">
          <ul className="space-y-1">
            {filtered.map((rel) => (
              <li key={rel.version}>
                <a
                  href={`#release-${slugVersion(rel.version)}`}
                  className="block rounded px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {rel.version}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases match your search.</p>
        ) : (
          filtered.map((rel) => {
            const isOpen = expanded.has(rel.version);
            return (
              <section
                key={rel.version}
                id={`release-${slugVersion(rel.version)}`}
                className="scroll-mt-24 rounded-lg border border-border bg-card"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(rel.version)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-bold text-foreground">{rel.version}</span>
                      {rel.isLatest ? (
                        <span className="rounded bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
                          LATEST
                        </span>
                      ) : null}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{rel.date}</p>
                    <p className="font-sans text-sm text-muted-foreground">{rel.summary}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{isOpen ? "[ - ]" : "[ + ]"}</span>
                </button>

                {isOpen ? (
                  <div className="space-y-8 border-t border-border px-5 py-6 sm:px-8">
                    {rel.url ? (
                      <Link
                        href={rel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-mono text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        View GitHub Release
                      </Link>
                    ) : null}

                    {rel.categories.map((cat, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                            [ {cat.badge} ]
                          </span>
                          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {cat.title}
                          </h2>
                        </div>

                        <div className="grid gap-4">
                          {cat.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="rounded-md border border-border bg-muted/40 p-4 space-y-2 transition hover:border-foreground/30"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-sans text-sm font-semibold text-foreground">{item.title}</h3>
                                {item.prNumber ? (
                                  <Link
                                    href={
                                      item.prLink ??
                                      `https://github.com/dineshkorukonda/VersionGate/pull/${item.prNumber}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                                  >
                                    PR #{item.prNumber}
                                  </Link>
                                ) : null}
                              </div>

                              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>

                              {item.command ? (
                                <div className="mt-2 overflow-x-auto rounded border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-foreground">
                                  <code>{item.command}</code>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
