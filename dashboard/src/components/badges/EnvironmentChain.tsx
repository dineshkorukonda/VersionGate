import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { EnvironmentEnvModal } from "@/components/modals/EnvironmentEnvModal";
import {
  promoteEnvironment,
  type EnvironmentSummary,
} from "@/lib/api";
import { publicEnvironmentUrl, publicServiceUrl } from "@/lib/deployment-display";

function ChainArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-neutral-600" aria-hidden>
      <svg width="24" height="24" viewBox="0 0 24 24" className="hidden sm:block">
        <path
          d="M5 12h14m-4-4 4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sm:hidden text-base leading-none py-1">↓</span>
    </div>
  );
}

export interface EnvironmentChainProps {
  projectId: string;
  projectName?: string;
  environments: EnvironmentSummary[];
  onRefresh: () => Promise<void>;
  /** Deploy/build for the leftmost environment in the chain (not always named “development”). */
  onDeployToEnvironment: (environmentId: string) => Promise<void>;
}

export function EnvironmentChain({
  projectId,
  projectName,
  environments,
  onRefresh,
  onDeployToEnvironment,
}: EnvironmentChainProps) {
  const navigate = useNavigate();
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [selectedEnvForVars, setSelectedEnvForVars] = useState<EnvironmentSummary | null>(null);

  const sorted = [...environments].sort((a, b) => a.chainOrder - b.chainOrder);

  const onPromote = async (targetEnvId: string, sourceEnvId: string) => {
    setPromotingId(targetEnvId);
    try {
      const r = await promoteEnvironment(projectId, targetEnvId, sourceEnvId);
      toast.success(`Promotion queued — job ${r.jobId.slice(0, 8)}…`);
      await onRefresh();
      navigate(`/projects/${projectId}/deploy/${r.jobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Promotion failed");
    } finally {
      setPromotingId(null);
    }
  };

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <EnvironmentEnvModal
        projectId={projectId}
        environment={selectedEnvForVars}
        open={Boolean(selectedEnvForVars)}
        onOpenChange={(open) => {
          if (!open) setSelectedEnvForVars(null);
        }}
        onRefresh={onRefresh}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
        {sorted.map((env, index) => {
          const upstream = index > 0 ? sorted[index - 1] : null;
          const upstreamActive = upstream?.activeDeployment?.status === "ACTIVE";
          const active = env.activeDeployment;
          const showPromote = index > 0;
          const promoteDisabled = !upstreamActive || promotingId !== null;
          const openUrl =
            active?.status === "ACTIVE" || active?.status === "DEPLOYING"
              ? publicEnvironmentUrl(
                  projectName ? { name: projectName, basePort: 0 } : undefined,
                  env.name,
                  active.port
                )
              : null;
          const directPortUrl = active ? publicServiceUrl(active.port) : null;
          const hasCustomEnv = env.env && Object.keys(env.env).length > 0;

          return (
            <div key={env.id} className="flex flex-1 min-w-[220px] flex-col gap-3 sm:flex-row sm:items-stretch">
              {index > 0 ? <ChainArrow /> : null}
              <div className="flex-1 rounded-xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between overflow-hidden">
                <div className="border-b border-neutral-800 bg-black/40 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      {env.name}
                    </span>
                    {active ? <StatusBadge status={active.status} /> : <StatusBadge status="PENDING" />}
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {active ? (
                    <div className="space-y-2 text-xs text-neutral-400">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-white">v{active.version}</span>
                        <span className="font-mono text-[11px] text-neutral-500">Port {active.port}</span>
                      </div>
                      {openUrl ? (
                        <div className="flex flex-col gap-1 pt-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <a
                              href={openUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              <span>Preview {env.name}</span>
                              <span className="text-[10px]" aria-hidden>↗</span>
                            </a>
                            <button
                              type="button"
                              className="text-[10px] text-neutral-500 hover:text-neutral-300"
                              onClick={() => {
                                void navigator.clipboard.writeText(openUrl);
                                toast.success(`Copied ${env.name} preview URL`);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                          {directPortUrl && directPortUrl !== openUrl ? (
                            <a
                              href={directPortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate font-mono text-[10px] text-neutral-600 hover:text-neutral-400"
                            >
                              Direct :{active.port} ↗
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">No active deployment yet.</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/60">
                    {index === 0 ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-white text-black font-semibold hover:bg-neutral-200"
                        onClick={() => void onDeployToEnvironment(env.id)}
                      >
                        Deploy to {env.name}
                      </Button>
                    ) : null}

                    {showPromote && upstream ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={promoteDisabled}
                        className="h-7 text-xs bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white"
                        onClick={() => void onPromote(env.id, upstream.id)}
                        title={
                          !upstreamActive
                            ? `Requires healthy active build on ${upstream.name}`
                            : `Promote artifact from ${upstream.name} to ${env.name}`
                        }
                      >
                        {promotingId === env.id ? "Promoting..." : `Promote ← ${upstream.name}`}
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-neutral-400 hover:text-white"
                      onClick={() => setSelectedEnvForVars(env)}
                    >
                      {hasCustomEnv ? "Env Vars (Custom)" : "Env Vars"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
