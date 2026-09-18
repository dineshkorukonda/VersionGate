import type { Deployment, Project } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { SlotBadge } from "@/components/badges/SlotBadge";
import { cn } from "@/lib/utils";
import {
  type DeploymentColor,
  healthCheckUrl,
  latestDeploymentForColor,
  publicServiceUrl,
} from "@/lib/deployment-display";

type SlotPhase = "live" | "deploying" | "idle";

function slotPhase(
  color: DeploymentColor,
  active: Deployment | undefined,
  deploying: Deployment | undefined
): SlotPhase {
  if (active?.color === color) return "live";
  if (deploying?.color === color) return "deploying";
  return "idle";
}

function phaseBadge(phase: SlotPhase): { label: string; dot: string; pill: string } {
  switch (phase) {
    case "live":
      return {
        label: "Receiving 100% Traffic",
        dot: "bg-emerald-500",
        pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      };
    case "deploying":
      return {
        label: "Deploying & Warming",
        dot: "bg-blue-500 animate-pulse",
        pill: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      };
    default:
      return {
        label: "Standby (0% Traffic)",
        dot: "bg-neutral-600",
        pill: "border-neutral-800 bg-neutral-900 text-neutral-400",
      };
  }
}

function statusLine(d: Deployment | undefined): string | null {
  if (!d) return null;
  if (d.status === "ACTIVE") return `v${d.version} active`;
  if (d.status === "DEPLOYING") return `v${d.version} deploying`;
  if (d.status === "FAILED") return `v${d.version} failed`;
  if (d.status === "ROLLED_BACK") return `v${d.version} retired`;
  return `v${d.version} ${d.status.toLowerCase()}`;
}

interface BlueGreenTrafficCardProps {
  project: Project;
  deployments: Deployment[];
  active: Deployment | undefined;
  deploying: Deployment | undefined;
  liveHostPort: number | null;
  liveUrl: string | null;
  onCopy: (text: string, label: string) => void;
}

export function BlueGreenTrafficCard({
  project,
  deployments,
  active,
  deploying,
  liveHostPort,
  liveUrl,
  onCopy,
}: BlueGreenTrafficCardProps) {
  const bluePort = project.basePort;
  const greenPort = project.basePort + 1;
  const blueUrl = publicServiceUrl(bluePort);
  const greenUrl = publicServiceUrl(greenPort);
  const latestBlue = latestDeploymentForColor(deployments, "BLUE");
  const latestGreen = latestDeploymentForColor(deployments, "GREEN");

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-white">Blue-Green Deployment Infrastructure</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Zero-downtime traffic switching. Live client traffic is routed instantly to the healthy upstream slot.
          </p>
        </div>

        {/* Traffic Flow Pipeline */}
        <div className="rounded-xl border border-neutral-800/80 bg-black/60 p-4">
          <div className="flex items-center justify-between gap-2 pb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Live Traffic Route</span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Swap Ready
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-neutral-200">
              <span className="size-1.5 rounded-full bg-neutral-400" />
              <span>Public Clients</span>
            </div>

            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-600 shrink-0">
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>

            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-neutral-200">
              <span className="size-1.5 rounded-full bg-sky-400" />
              <span>Nginx Edge Gateway</span>
            </div>

            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-600 shrink-0">
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>

            {liveHostPort != null && liveUrl ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-mono text-emerald-300 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Slot {active?.color ?? "—"} (:{liveHostPort})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-800 px-3 py-1.5 text-neutral-500">
                <span>Pending first deployment</span>
              </div>
            )}

            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-600 shrink-0">
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>

            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 font-mono text-neutral-300">
              <span>{project.deploymentType === "pm2" ? "pm2" : "container"} :{project.appPort}</span>
            </div>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                color: "BLUE" as const,
                port: bluePort,
                url: blueUrl,
                latest: latestBlue,
              },
              {
                color: "GREEN" as const,
                port: greenPort,
                url: greenUrl,
                latest: latestGreen,
              },
            ] as const
          ).map(({ color, port, url, latest }) => {
            const phase = slotPhase(color, active, deploying);
            const pb = phaseBadge(phase);
            const healthUrl = healthCheckUrl(project, port);
            const isLive = phase === "live";

            return (
              <div
                key={color}
                className={cn(
                  "relative flex flex-col justify-between rounded-xl border p-5 transition-all",
                  isLive
                    ? "border-emerald-500/40 bg-emerald-500/[0.02] shadow-sm shadow-emerald-950/20"
                    : "border-neutral-800/80 bg-black/40 hover:border-neutral-700"
                )}
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SlotBadge color={color} />
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                          pb.pill
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full shrink-0", pb.dot)} />
                        {pb.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-neutral-400 font-medium">host:{port}</span>
                  </div>

                  <p className="break-all font-mono text-xs text-neutral-300">
                    {url.replace(/^https?:\/\//, "")}
                  </p>

                  <dl className="mt-4 space-y-2 text-xs divide-y divide-neutral-800/40">
                    <div className="flex justify-between gap-2 pt-2">
                      <dt className="text-neutral-500 font-sans">Upstream Target</dt>
                      <dd className="font-mono text-right text-neutral-300">
                        {port} → {project.appPort}
                      </dd>
                    </div>
                    {latest ? (
                      <>
                        <div className="flex justify-between gap-2 pt-2">
                          <dt className="text-neutral-500 font-sans">Active Image</dt>
                          <dd className="font-mono text-right text-neutral-200">
                            {statusLine(latest)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 pt-2">
                          <dt className="text-neutral-500 font-sans">
                            {project.deploymentType === "pm2" ? "Process" : "Container"}
                          </dt>
                          <dd className="max-w-[14rem] truncate font-mono text-right text-neutral-400" title={latest.containerName}>
                            {latest.containerName}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <p className="pt-2 text-neutral-500 text-xs font-sans">No deployment in this slot yet.</p>
                    )}
                  </dl>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-800/60 font-sans">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-7 text-xs border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white gap-1",
                    })}
                  >
                    <span>Open Slot</span>
                    <span className="text-[10px]" aria-hidden>↗</span>
                  </a>
                  <a
                    href={healthUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "h-7 text-xs text-neutral-400 hover:text-white gap-1",
                    })}
                  >
                    <span>Health Check</span>
                    <span className="text-[10px]" aria-hidden>↗</span>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-neutral-400 hover:text-white"
                    onClick={() => onCopy(url, "App URL")}
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {liveUrl && active && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-neutral-800 bg-black/40 px-6 py-3 text-xs text-neutral-400 font-sans">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Live traffic routed to slot <SlotBadge color={active.color} /> on host port{" "}
              <span className="font-mono text-white">:{liveHostPort}</span>
            </span>
          </div>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>{liveUrl}</span>
            <span className="text-[10px]" aria-hidden>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
