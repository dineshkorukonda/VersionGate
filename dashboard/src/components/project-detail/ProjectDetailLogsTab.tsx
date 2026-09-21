import { RuntimeLogsViewer } from "@/components/RuntimeLogsViewer";
import { AggregateJobLogStream } from "@/components/AggregateJobLogStream";

interface ProjectDetailLogsTabProps {
  runtimeContainerName: string | null;
  runtimeLogs: string[];
  runtimeLogsLoading: boolean;
  runtimeAutoRefresh: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: (value: boolean) => void;
}

export function ProjectDetailLogsTab({
  runtimeContainerName,
  runtimeLogs,
  runtimeLogsLoading,
  runtimeAutoRefresh,
  onRefresh,
  onToggleAutoRefresh,
}: ProjectDetailLogsTabProps) {
  return (
    <div className="space-y-6">
      <RuntimeLogsViewer
        title="Live Application Container Logs (stdout/stderr)"
        containerName={runtimeContainerName}
        logs={runtimeLogs}
        loading={runtimeLogsLoading}
        onRefresh={onRefresh}
        autoRefresh={runtimeAutoRefresh}
        onToggleAutoRefresh={onToggleAutoRefresh}
        emptyMessage="No active container running or no container logs emitted yet."
        maxHeightClass="max-h-96"
      />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Recent Deployment Tail
        </h3>
        <AggregateJobLogStream title="Recent jobs on this instance" pollMs={8000} />
      </div>
    </div>
  );
}
