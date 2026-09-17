import { useState, useEffect } from "react";
import { CronJobsManager } from "@/components/CronJobsManager";
import { getProjects, type Project } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";

export function CronJobs() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void getProjects()
      .then((res) => setProjects(res.projects || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Cron Automation"
        description="Configure automated recurring background jobs, HTTP health check webhooks, and containerized routines across all host projects."
      />

      <CronJobsManager projects={projects} />
    </div>
  );
}
