import { useNavigate } from "react-router-dom";
import { BlueGreenTrafficCard } from "@/components/BlueGreenTrafficCard";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavIconCheck,
  NavIconChevron,
} from "@/components/nav-icons";
import { cn } from "@/lib/utils";
import type { Deployment, Project, ProjectAnalytics, ProjectDomain } from "@/lib/api";

export interface ProjectDetailOverviewTabProps {
  project: Project;
  customDomains: ProjectDomain[];
  productionDeployments: Deployment[];
  analytics: ProjectAnalytics | null;
  active: Deployment | undefined;
  deploying: Deployment | undefined;
  displayStatus: string;
  liveHostPort: number;
  liveUrl: string | null;
  repoHref: string;
  onDeploy: () => void;
  onRollback: () => void;
  onDeleteRequest: () => void;
  copyText: (text: string, label: string) => void;
}

export function ProjectDetailOverviewTab({
  project,
  customDomains,
  productionDeployments,
  analytics,
  active,
  deploying,
  displayStatus,
  liveHostPort,
  liveUrl,
  repoHref,
  onDeploy,
  onRollback,
  onDeleteRequest,
  copyText,
}: ProjectDetailOverviewTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 px-6 py-4">
          <h2 className="text-base font-semibold text-white">Production Deployment</h2>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="flex size-8 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
              title="View Git Repository"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRollback()}
              className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white text-xs h-8 gap-1.5"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                <path d="M2.5 8a5.5 5.5 0 0 1 9.39-3.89M13.5 8a5.5 5.5 0 0 1-9.39 3.89M2.5 4v4h4M13.5 12V8h-4" />
              </svg>
              <span>Instant Rollback</span>
            </Button>

            {liveUrl ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-neutral-800 bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-8 gap-1.5"
                  )}
                >
                  <span>Visit</span>
                  <NavIconChevron className="size-3 opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
                  <DropdownMenuItem
                    className="cursor-pointer text-xs hover:bg-neutral-900"
                    onClick={() => window.open(liveUrl, "_blank")}
                  >
                    <span className="truncate">{liveUrl.replace(/^https?:\/\//, "")}</span>
                  </DropdownMenuItem>
                  {customDomains.map((cd) => (
                    <DropdownMenuItem
                      key={cd.id}
                      className="cursor-pointer text-xs hover:bg-neutral-900"
                      onClick={() => window.open(`https://${cd.hostname}`, "_blank")}
                    >
                      <span className="truncate">{cd.hostname}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
                onClick={() => void onDeploy()}
              >
                Deploy
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8 px-2.5",
                })}
              >
                •••
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-neutral-800 bg-[#0a0a0a] text-white text-xs">
                <DropdownMenuItem
                  onClick={() => void onDeploy()}
                  className="text-neutral-300 hover:text-white cursor-pointer"
                >
                  Trigger New Deployment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/projects/${project.id}/settings`)}
                  className="text-neutral-300 hover:text-white cursor-pointer"
                >
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem
                  onClick={onDeleteRequest}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="w-full lg:w-80 shrink-0">
              <div className="aspect-[16/10] rounded-lg border border-neutral-800 bg-black/60 overflow-hidden flex flex-col justify-between p-4 relative group">
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="size-2 rounded-full bg-neutral-700" />
                  <span className="size-2 rounded-full bg-neutral-700" />
                  <span className="size-2 rounded-full bg-neutral-700" />
                  <div className="ml-2 flex-1 truncate rounded bg-neutral-950 px-2 py-0.5 text-[9px] font-mono text-neutral-500">
                    {liveUrl ? liveUrl.replace(/^https?:\/\//, "") : "versiongate.app"}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center my-auto">
                  <div className="size-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-bold text-base mb-1 shadow-inner">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-xs text-white truncate max-w-full">{project.name}</p>
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {displayStatus === "ACTIVE" ? "Production Ready" : displayStatus}
                  </span>
                </div>

                {liveUrl && (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Open Preview</span>
                    <span className="text-[9px]">↗</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 min-w-0">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-neutral-500 font-medium">Deployment</span>
                  <p className="mt-1 font-mono text-neutral-200 truncate select-all">
                    {liveUrl ? liveUrl.replace(/^https?:\/\//, "") : `${project.name}.internal`}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500 font-medium">Domains</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}/domains`)}
                      className="text-neutral-400 hover:text-white text-xs font-semibold"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-1 truncate">
                    {customDomains.length > 0 ? (
                      <a
                        href={`https://${customDomains[0].hostname}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{customDomains[0].hostname}</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    ) : (
                      <span className="text-neutral-500 font-mono">None configured</span>
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-neutral-500 font-medium">Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        displayStatus === "ACTIVE"
                          ? "bg-emerald-500"
                          : displayStatus === "DEPLOYING"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-neutral-500"
                      )}
                    />
                    <span className="font-medium text-neutral-200">
                      {displayStatus === "ACTIVE" ? "Ready" : displayStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 font-medium">Created</span>
                  <p className="mt-1 text-neutral-400 text-xs">
                    {active?.createdAt ? new Date(active.createdAt).toLocaleDateString() : "Just now"} by{" "}
                    <span className="text-neutral-300 font-medium">
                      {active?.commitAuthor || "system"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-800/80 pt-3 text-xs">
                <span className="text-neutral-500 font-medium">Source</span>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-300">
                  <span className="inline-flex items-center gap-1 text-neutral-400">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-500">
                      <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
                    </svg>
                    <span>{project.branch}</span>
                  </span>
                  <span className="text-neutral-600">-o-</span>
                  <span className="text-neutral-400">
                    {active?.commitSha ? active.commitSha.slice(0, 7) : "HEAD"}
                  </span>
                  <span className="text-neutral-400 truncate max-w-xs">
                    {active?.commitMessage || "Zero-downtime blue/green deployment active"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 bg-black/40 px-6 py-3 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}/settings`)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <NavIconChevron className="size-3" />
            <span className="font-semibold text-neutral-300">Deployment Settings</span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.2 text-[10px] font-medium text-blue-400">
              2 Recommendations
            </span>
          </button>
        </div>

        <div className="border-t border-neutral-800 bg-neutral-950/80 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-500">
          <span>To update your Production Deployment, push to the main branch.</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/${project.id}/deployments`)}
              className="font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Deployments
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Production Checklist</h3>
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                3/5
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="truncate">Connect Git Repository</span>
                <NavIconCheck className="text-blue-400" />
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="truncate">Add Custom Domain</span>
                <NavIconCheck className="text-blue-400" />
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="truncate">Preview Deployment</span>
                <NavIconCheck className="text-blue-400" />
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span className="truncate">Enable Web Analytics</span>
                <span className="size-1.5 rounded-full bg-neutral-600" />
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span className="truncate">Upgrade to Speed Insights Plus</span>
                <span className="size-1.5 rounded-full bg-neutral-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Observability</h3>
              <span className="text-xs text-neutral-500 font-mono">6h</span>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Edge Requests</span>
                  <span className="font-mono font-semibold text-white">{analytics?.totalHits ?? 32}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-2/3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Function Invocations</span>
                  <span className="font-mono font-semibold text-white">21</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400">Error Rate</span>
                <span className="font-mono font-semibold text-emerald-400">0%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Analytics</h3>
              <NavIconChevron className="size-3 text-neutral-500" />
            </div>
            <p className="text-xs font-medium text-neutral-300">Track Visitors and Page Views</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              See real-time traffic, top pages, and audience trends for this deployment.
            </p>
          </div>

          <div className="pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/projects/${project.id}/observability`)}
              className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-200 hover:bg-neutral-800"
            >
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      <BlueGreenTrafficCard
        project={project}
        deployments={productionDeployments}
        active={active}
        deploying={deploying}
        liveHostPort={liveHostPort}
        liveUrl={liveUrl}
        onCopy={copyText}
      />
    </div>
  );
}
