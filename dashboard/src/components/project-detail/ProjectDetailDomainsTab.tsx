import { ProjectCustomDomainCard } from "@/components/ProjectCustomDomainCard";

interface ProjectDetailDomainsTabProps {
  projectId: string;
  liveUrl: string | null;
  onCopy: (text: string, label: string) => void;
  onUpdated: () => void;
}

export function ProjectDetailDomainsTab({
  projectId,
  liveUrl,
  onCopy,
  onUpdated,
}: ProjectDetailDomainsTabProps) {
  return (
    <div className="space-y-6">
      <ProjectCustomDomainCard
        projectId={projectId}
        liveUrl={liveUrl}
        onCopy={onCopy}
        onUpdated={onUpdated}
      />
    </div>
  );
}
