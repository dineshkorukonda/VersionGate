import { useQuery } from "@tanstack/react-query";
import { getProjects, getProjectsSummary, type Project, type ProjectSummaryItem } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async (): Promise<Project[]> => {
      const res = await getProjects();
      return res.projects;
    },
  });
}

export function useProjectsSummary() {
  return useQuery({
    queryKey: queryKeys.projects.summary,
    queryFn: async (): Promise<ProjectSummaryItem[]> => {
      const res = await getProjectsSummary();
      return res.projects;
    },
    refetchInterval: 12_000,
  });
}
