import { BlueGreenTrafficCard } from "@/components/BlueGreenTrafficCard";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import type { Deployment, Project, ProjectAnalytics } from "@/lib/api";

export interface ProjectDetailObservabilityTabProps {
  project: Project;
  productionDeployments: Deployment[];
  analytics: ProjectAnalytics | null;
  active: Deployment | undefined;
  deploying: Deployment | undefined;
  liveHostPort: number;
  liveUrl: string | null;
  copyText: (text: string, label: string) => void;
}

export function ProjectDetailObservabilityTab({
  project,
  productionDeployments,
  analytics,
  active,
  deploying,
  liveHostPort,
  liveUrl,
  copyText,
}: ProjectDetailObservabilityTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <VercelCardBox title="Total Requests" description="Past 24 hours">
          <p className="font-mono text-3xl font-bold text-white">{analytics?.totalHits ?? 0}</p>
        </VercelCardBox>
        <VercelCardBox title="2xx Success" description="Successful responses">
          <p className="font-mono text-3xl font-bold text-emerald-400">{analytics?.status2xx ?? 0}</p>
        </VercelCardBox>
        <VercelCardBox title="4xx Client Error" description="Client side rejections">
          <p className="font-mono text-3xl font-bold text-amber-400">{analytics?.status4xx ?? 0}</p>
        </VercelCardBox>
        <VercelCardBox title="5xx Server Error" description="Upstream proxy errors">
          <p className="font-mono text-3xl font-bold text-red-400">{analytics?.status5xx ?? 0}</p>
        </VercelCardBox>
      </div>

      <VercelCardBox
        title="Upstream Proxy Latency"
        description="Average response time across all container instances."
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold text-white">
            {analytics?.avgLatencyMs ?? 0} ms
          </span>
          <span className="text-xs text-neutral-400">Rolling 24-hour average</span>
        </div>
      </VercelCardBox>

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
