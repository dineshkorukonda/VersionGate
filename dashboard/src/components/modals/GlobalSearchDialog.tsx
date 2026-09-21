import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, type Project } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  category: "PROJECTS" | "NAVIGATION" | "ACTIONS";
  title: string;
  subtitle?: string;
  badge?: string;
  action: () => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  onLaunchCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunchCreate?: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setSelectedIndex(0);
      return;
    }
    let cancelled = false;
    void getProjects()
      .then((r) => {
        if (!cancelled) setProjects(r.projects);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const navItems: CommandItem[] = useMemo(() => [
    {
      id: "nav-overview",
      category: "NAVIGATION",
      title: "Overview",
      subtitle: "Dashboard summary, telemetry matrix, and live slots",
      badge: "01",
      action: () => {
        onOpenChange(false);
        navigate("/");
      },
    },
    {
      id: "nav-projects",
      category: "NAVIGATION",
      title: "Projects",
      subtitle: "View and manage all active application deployments",
      badge: "02",
      action: () => {
        onOpenChange(false);
        navigate("/projects");
      },
    },
    {
      id: "nav-databases",
      category: "NAVIGATION",
      title: "Databases",
      subtitle: "PostgreSQL, MySQL, Redis, and linked data services",
      badge: "03",
      action: () => {
        onOpenChange(false);
        navigate("/databases");
      },
    },
    {
      id: "nav-activity",
      category: "NAVIGATION",
      title: "Activity",
      subtitle: "System-wide deployment queue and execution audit stream",
      badge: "04",
      action: () => {
        onOpenChange(false);
        navigate("/activity");
      },
    },
    {
      id: "nav-integrations",
      category: "NAVIGATION",
      title: "Integrations",
      subtitle: "GitHub Apps, registry credentials, and webhook endpoints",
      badge: "05",
      action: () => {
        onOpenChange(false);
        navigate("/integrations");
      },
    },
    {
      id: "nav-system",
      category: "NAVIGATION",
      title: "System Health",
      subtitle: "Host CPU, RAM, disk usage, Docker socket telemetry",
      badge: "06",
      action: () => {
        onOpenChange(false);
        navigate("/system");
      },
    },
    {
      id: "nav-settings",
      category: "NAVIGATION",
      title: "Settings",
      subtitle: "Instance configuration, public domain, and TLS certs",
      badge: "07",
      action: () => {
        onOpenChange(false);
        navigate("/settings");
      },
    },
  ], [navigate, onOpenChange]);

  const actionItems: CommandItem[] = useMemo(() => [
    {
      id: "act-new-project",
      category: "ACTIONS",
      title: "Deploy New Project",
      subtitle: "Configure Git repo, blue/green slots, and environment variables",
      badge: "NEW",
      action: () => {
        onOpenChange(false);
        if (onLaunchCreate) {
          onLaunchCreate();
        } else {
          navigate("/projects");
        }
      },
    },
    {
      id: "act-docs",
      category: "ACTIONS",
      title: "Documentation",
      subtitle: "Architecture, networking, reverse proxy, and zero-downtime guides",
      badge: "DOCS",
      action: () => {
        onOpenChange(false);
        window.open("https://github.com/dineshkorukonda/VersionGate/blob/main/docs/SETUP.md", "_blank");
      },
    },
  ], [navigate, onOpenChange, onLaunchCreate]);

  const projectItems: CommandItem[] = useMemo(() => {
    return projects.map((p) => ({
      id: `proj-${p.id}`,
      category: "PROJECTS" as const,
      title: p.name,
      subtitle: p.repoUrl || "Git-backed deployment",
      badge: "PROJECT",
      action: () => {
        onOpenChange(false);
        navigate(`/projects/${p.id}`);
      },
    }));
  }, [projects, navigate, onOpenChange]);

  const allItems = useMemo(() => {
    return [...projectItems, ...navItems, ...actionItems];
  }, [projectItems, navItems, actionItems]);

  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allItems;
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(term))
    );
  }, [allItems, q]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [q]);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>(`[data-command-index="${selectedIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  const grouped = useMemo(() => {
    const groups: { category: string; items: { item: CommandItem; index: number }[] }[] = [];
    const catMap = new Map<string, { item: CommandItem; index: number }[]>();

    filteredItems.forEach((item, index) => {
      if (!catMap.has(item.category)) {
        catMap.set(item.category, []);
      }
      catMap.get(item.category)!.push({ item, index });
    });

    for (const [category, items] of catMap.entries()) {
      groups.push({ category, items });
    }
    return groups;
  }, [filteredItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-neutral-800 bg-[#0a0a0a] p-0 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>Search projects, system navigation, and operational actions.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 bg-[#0a0a0a]">
          <span className="font-mono text-xs text-neutral-500 font-semibold">[CMD]</span>
          <Input
            autoFocus
            role="combobox"
            aria-expanded={open}
            aria-controls="global-search-listbox"
            aria-activedescendant={
              filteredItems[selectedIndex] ? `global-search-option-${selectedIndex}` : undefined
            }
            aria-label="Search commands and projects"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search projects..."
            className="h-9 border-0 bg-transparent px-0 font-sans text-sm text-white placeholder:text-neutral-500 shadow-none focus-visible:ring-0"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 hover:text-white"
            >
              CLEAR
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                ESC
              </kbd>
            </div>
          )}
        </div>

        <div
          id="global-search-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-[380px] overflow-y-auto p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-mono text-xs text-neutral-400">No matching commands or projects found</p>
              <p className="mt-1 font-sans text-[11px] text-neutral-600">
                Try searching for a project name, page title, or operational action
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category} className="mb-3 last:mb-0">
                <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  {group.category}
                </div>
                <div className="mt-1 space-y-0.5">
                  {group.items.map(({ item, index }) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        id={`global-search-option-${index}`}
                        data-command-index={index}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-neutral-900 text-white"
                            : "text-neutral-300 hover:bg-neutral-900/60 hover:text-white"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs font-sans truncate" title={item.title}>{item.title}</span>
                            {item.badge && (
                              <span className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.2 font-mono text-[9px] text-neutral-400">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500" title={item.subtitle}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="shrink-0 font-mono text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                            SELECT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>Navigation:</span>
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 py-0.5">UP</kbd>
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 py-0.5">DOWN</kbd>
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 py-0.5">ENTER</kbd>
          </div>
          <span className="font-mono text-[10px] text-neutral-600">VersionGate Command 2.4</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
