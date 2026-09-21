import { CronJobsManager } from "@/components/CronJobsManager";
import type { Project } from "@/lib/api";

interface ProjectDetailCronTabProps {
  projectId: string;
  project: Project;
}

export function ProjectDetailCronTab({ projectId, project }: ProjectDetailCronTabProps) {
  return (
    <div className="space-y-6">
      <CronJobsManager projectId={projectId} project={project} />
    </div>
  );
}
