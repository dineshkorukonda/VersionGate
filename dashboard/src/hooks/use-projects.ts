import { useQuery } from "@tanstack/react-query";
import { getProjects, getProjectsSummary, type Project, type ProjectSummaryItem } from "@/lib/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const res = await getProjects();
      return res.projects;
    },
  });
}

export function useProjectsSummary() {
  return useQuery({
    queryKey: ["projects", "summary"],
    queryFn: async (): Promise<ProjectSummaryItem[]> => {
      const res = await getProjectsSummary();
      return res.projects;
    },
  });
}
