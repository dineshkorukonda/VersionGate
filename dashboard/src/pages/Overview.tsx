import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getInstanceSettings,
  listAllJobs,
  triggerDeploy,
  type JobRecord,
  type Project,
} from "@/lib/api";
import { useAllDeployments } from "@/hooks/use-deployments";
import { useProjectsSummary } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLaunchCreateProject } from "@/create-project-launch";
import {
  publicProjectLiveUrl,
  setConfiguredPublicHost,
} from "@/lib/deployment-display";
import { projectDeploymentStatus } from "@/lib/project-deployment-status";
import { DeleteProjectDialog } from "@/components/modals/DeleteProjectDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeploymentList } from "@/components/DeploymentList";
import {
  NavIconGrid,
  NavIconList,
  NavIconSearch,
  NavIconGithub,
  NavIconGitBranch,
  NavIconExternal,
  NavIconChevron,
} from "@/components/nav-icons";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Overview() {
  const launchCreate = useLaunchCreateProject();
  const navigate = useNavigate();
  const { data: summaryProjects = [], isLoading: summaryLoading } = useProjectsSummary();
  const { data: deployments = [], isLoading: deploymentsLoading } = useAllDeployments();
  const projects = summaryProjects as Project[];
  const [domainsByProject, setDomainsByProject] = useState<Record<string, { hostname: string; sslStatus: string }[]>>({});
  const [latestJobs, setLatestJobs] = useState<Record<string, JobRecord | undefined>>({});
  const [, setRecentJobs] = useState<JobRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // Filter & layout state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deploying" | "failed">("all");
  const [sortBy, setSortBy] = useState<"activity" | "name" | "created">("activity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent && projects.length === 0) {
      setInitialLoading(true);
    }
    try {
      const [allJobs, inst] = await Promise.all([
        listAllJobs({ limit: 10 }),
        getInstanceSettings().catch(() => null),
      ]);
      setRecentJobs(allJobs.jobs);
      setConfiguredPublicHost(inst?.publicDomain);

      const domainMap: Record<string, { hostname: string; sslStatus: string }[]> = {};
      const jobMap: Record<string, JobRecord | undefined> = {};
      for (const proj of summaryProjects) {
        domainMap[proj.id] = (proj.domains as { hostname: string; sslStatus: string }[]) || [];
        jobMap[proj.id] = (proj.latestJob as JobRecord) || undefined;
      }
      setDomainsByProject(domainMap);
      setLatestJobs(jobMap);
    } catch (e) {
      if (!isSilent) {
        toast.error(e instanceof Error ? e.message : "Failed to load dashboard state");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [summaryProjects]);

  useEffect(() => {
    void loadData(false);
    const interval = window.setInterval(() => void loadData(true), 12000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const stats = useMemo(() => {
    let running = 0;
    let failed = 0;
    let deploying = 0;
    for (const proj of projects) {
      const s = projectDeploymentStatus(proj.id, deployments);
      if (s === "ACTIVE") running++;
      if (s === "FAILED") failed++;
      if (s === "DEPLOYING") deploying++;
    }
    return { total: projects.length, running, failed, deploying };
  }, [projects, deployments]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesRepo = p.repoUrl.toLowerCase().includes(q);
          const matchesBranch = p.branch.toLowerCase().includes(q);
          if (!matchesName && !matchesRepo && !matchesBranch) return false;
        }

        // Status filter
        if (statusFilter !== "all") {
          const st = projectDeploymentStatus(p.id, deployments);
          if (statusFilter === "active" && st !== "ACTIVE") return false;
          if (statusFilter === "deploying" && st !== "DEPLOYING") return false;
          if (statusFilter === "failed" && st !== "FAILED") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "created") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Activity: sort by latest deployment or job
        const aTime = latestJobs[a.id]?.createdAt ?? a.updatedAt;
        const bTime = latestJobs[b.id]?.createdAt ?? b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [projects, deployments, latestJobs, searchQuery, statusFilter, sortBy]);

  const onDeploy = async (projectId: string) => {
    try {
      const r = await triggerDeploy(projectId);
      toast.success(`Deploy queued — job ${r.jobId.slice(0, 8)}…`);
      navigate(`/projects/${projectId}/deploy/${r.jobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    }
  };

  if ((initialLoading || summaryLoading || deploymentsLoading) && projects.length === 0) {
    return (
      <div className="w-full space-y-6 max-w-7xl font-sans">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 max-w-7xl font-sans text-neutral-100">
      {/* Top Workspace Controls Bar: Search, Filters, View Modes, and Add New */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-3xl">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <NavIconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Projects..."
              className="h-9 rounded-md border border-neutral-800 bg-[#0a0a0a] pl-8 pr-7 text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-500 focus-visible:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-800 bg-[#0a0a0a] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded px-2.5 py-1 text-xs transition-colors",
                statusFilter === "all"
                  ? "bg-neutral-800 font-semibold text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              All ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                statusFilter === "active"
                  ? "bg-neutral-800 font-semibold text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active ({stats.running})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("deploying")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                statusFilter === "deploying"
                  ? "bg-neutral-800 font-semibold text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
              Building ({stats.deploying})
            </button>
            {stats.failed > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("failed")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                  statusFilter === "failed"
                    ? "bg-neutral-800 font-semibold text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <span className="size-1.5 rounded-full bg-red-500" />
                Failed ({stats.failed})
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "activity" | "name" | "created")}
            className="h-9 rounded-md border border-neutral-800 bg-[#0a0a0a] px-3 text-xs text-neutral-300 outline-none hover:border-neutral-700 cursor-pointer"
          >
            <option value="activity">Sort by activity</option>
            <option value="name">Sort by name</option>
            <option value="created">Sort by created date</option>
          </select>
        </div>

        {/* Right Controls: Grid/List Toggle and Add New */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-[#0a0a0a] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              )}
              title="Grid view"
            >
              <NavIconGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded p-1.5 transition-colors",
                viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              )}
              title="List view"
            >
              <NavIconList className="size-3.5" />
            </button>
          </div>

          {/* Add New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-black hover:bg-neutral-200 shrink-0 transition-colors">
              <span>+ Add New...</span>
              <NavIconChevron className="size-2.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-neutral-800 bg-[#0a0a0a] text-white text-xs">
              <DropdownMenuItem
                onClick={launchCreate}
                className="cursor-pointer hover:bg-neutral-900 py-2"
              >
                <span className="font-medium">Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/databases")}
                className="cursor-pointer hover:bg-neutral-900 py-2"
              >
                <span>Database</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/cron")}
                className="cursor-pointer hover:bg-neutral-900 py-2"
              >
                <span>Cron Job</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                onClick={() => navigate("/deployments")}
                className="cursor-pointer hover:bg-neutral-900 py-2 text-neutral-400 hover:text-white"
              >
                <span>View All Deployments</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Minimalist Vercel-Style Geist Metrics Strip */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/80 grid grid-cols-2 lg:grid-cols-4">
        <div className="p-4">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Projects</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tracking-tight">{stats.total}</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">{stats.running} active in production</p>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Pipeline Activity</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tracking-tight">{deployments.length}</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            {stats.deploying > 0 ? `${stats.deploying} builds running` : "Zero builds running"}
          </p>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Traffic Routing</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tracking-tight">Blue / Green</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">Atomic zero-downtime swaps</p>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Cluster Health</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tracking-tight">
            {stats.failed > 0 ? (
              <span className="text-red-400">{stats.failed} Alerts</span>
            ) : (
              <span className="text-emerald-400">100%</span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-500">Self-hosted control plane engine</p>
        </div>
      </div>

      {/* Projects Display: Empty State OR Grid View OR List View */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] p-12 text-center">
          <div className="size-12 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-white text-lg font-bold mb-3">
            +
          </div>
          <h3 className="text-sm font-semibold text-white">No active projects</h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-400 leading-relaxed">
            Deploy your first Git-backed project with atomic blue/green routing, SSL termination, and instant rollback.
          </p>
          <Button
            size="sm"
            onClick={launchCreate}
            className="mt-5 bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
          >
            Deploy First Project
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-[#0a0a0a] p-12 text-center">
          <p className="text-xs text-neutral-400">No projects match your current search or filter criteria.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-3 border-neutral-800 text-xs text-neutral-300 hover:text-white"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Authentic Vercel Project Cards Grid */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((p) => {
            const mine = deployments.filter((d) => d.projectId === p.id);
            const st = projectDeploymentStatus(p.id, deployments);
            const domains = domainsByProject[p.id] ?? [];
            const liveUrl = publicProjectLiveUrl(p, domains, p.basePort);
            const lastDeploy = mine.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            const cleanRepo = p.repoUrl
              ? p.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
              : "git-repo";

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 transition-all hover:border-neutral-700 hover:shadow-lg cursor-pointer space-y-4"
              >
                {/* Card Top: Avatar, Name, Domain, & Overflow Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-9 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0 group-hover:border-neutral-700 transition-colors">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/projects/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate font-semibold text-sm text-white hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.2 font-mono text-[10px] text-neutral-400 shrink-0">
                          {p.branch}
                        </span>
                      </div>
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-mono truncate transition-colors"
                        >
                          <span className="truncate">{liveUrl.replace(/^https?:\/\//, "")}</span>
                          <NavIconExternal className="size-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                        </a>
                      ) : (
                        <p className="mt-0.5 text-xs text-neutral-500 font-mono">Pending deployment</p>
                      )}
                    </div>
                  </div>

                  {/* Overflow menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex size-7 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors shrink-0 text-xs font-mono"
                    >
                      •••
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 border-neutral-800 bg-[#0a0a0a] text-white text-xs">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDeploy(p.id);
                        }}
                        className="cursor-pointer hover:bg-neutral-900 py-1.5"
                      >
                        Trigger Deployment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}/settings`);
                        }}
                        className="cursor-pointer hover:bg-neutral-900 py-1.5"
                      >
                        Project Settings
                      </DropdownMenuItem>
                      {liveUrl && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigator.clipboard.writeText(liveUrl);
                            toast.success("Domain copied to clipboard");
                          }}
                          className="cursor-pointer hover:bg-neutral-900 py-1.5"
                        >
                          Copy Live URL
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-neutral-800" />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p);
                        }}
                        className="cursor-pointer hover:bg-red-950/20 text-red-400 py-1.5"
                      >
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Middle: Status Indicator & Commit Details */}
                <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {st === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </span>
                      ) : st === "DEPLOYING" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                          <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
                          Building
                        </span>
                      ) : st === "FAILED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                          <span className="size-1.5 rounded-full bg-neutral-500" />
                          Standby
                        </span>
                      )}
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                        Production
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {lastDeploy ? timeAgo(lastDeploy.createdAt) : timeAgo(p.createdAt)}
                    </span>
                  </div>

                  {/* Commit message & SHA line */}
                  <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3 text-neutral-500 shrink-0">
                      <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32zM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                    </svg>
                    <span className="font-mono text-[11px] text-neutral-300">
                      {lastDeploy?.commitSha ? lastDeploy.commitSha.slice(0, 7) : "head"}
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span className="truncate text-neutral-400 text-[11px]">
                      {lastDeploy?.commitMessage || `Deployed on branch ${p.branch}`}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Connected Git Repository */}
                <div className="flex items-center justify-between border-t border-neutral-800/60 pt-3 text-xs text-neutral-400">
                  <a
                    href={p.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 hover:text-white transition-colors truncate"
                  >
                    <NavIconGithub className="size-3.5 text-neutral-400" />
                    <span className="truncate font-mono text-[11px]">{cleanRepo}</span>
                  </a>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                    <NavIconGitBranch className="size-3 text-neutral-500" />
                    <span>{p.branch}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Authentic Vercel Dense Table List View */
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Project</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Environment</th>
                <th className="p-3.5">Git Branch & Commit</th>
                <th className="p-3.5">Last Deployed</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredProjects.map((p) => {
                const mine = deployments.filter((d) => d.projectId === p.id);
                const st = projectDeploymentStatus(p.id, deployments);
                const domains = domainsByProject[p.id] ?? [];
                const liveUrl = publicProjectLiveUrl(p, domains, p.basePort);
                const lastDeploy = mine.sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="hover:bg-neutral-900/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate hover:underline">{p.name}</p>
                          {liveUrl && (
                            <p className="text-[11px] font-mono text-neutral-400 truncate">
                              {liveUrl.replace(/^https?:\/\//, "")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {st === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </span>
                      ) : st === "DEPLOYING" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                          <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
                          Building
                        </span>
                      ) : st === "FAILED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                          <span className="size-1.5 rounded-full bg-neutral-500" />
                          Standby
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                        Production
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <NavIconGitBranch className="size-3 text-neutral-500" />
                        <span>{p.branch}</span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-neutral-400">
                          {lastDeploy?.commitSha ? lastDeploy.commitSha.slice(0, 7) : "main"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {lastDeploy ? timeAgo(lastDeploy.createdAt) : timeAgo(p.createdAt)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs px-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDeploy(p.id);
                        }}
                      >
                        Deploy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Deployments Activity Feed */}
      {deployments.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Deployments</h2>
              <p className="text-xs text-neutral-400">Latest production and preview builds across your projects</p>
            </div>
            <Link
              to="/deployments"
              className="text-xs text-neutral-400 hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              View all deployments ↗
            </Link>
          </div>
          <DeploymentList
            deployments={[...deployments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 6)}
            showProject
          />
        </div>
      )}

      {/* Delete Project Dialog */}
      {deleteTarget ? (
        <DeleteProjectDialog
          open
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          projectId={deleteTarget.id}
          projectName={deleteTarget.name}
          navigateTo={false}
          onDeleted={() => {
            void loadData(false);
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
