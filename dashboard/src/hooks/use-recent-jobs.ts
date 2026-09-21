import { useQuery } from "@tanstack/react-query";
import { listAllJobs, type JobRecord } from "@/lib/api";
import { queryKeys } from "./query-keys";

export type RecentJobsResult = {
  jobs: JobRecord[];
  total: number;
};

export function useRecentJobs(limit = 200, refetchInterval = 8_000) {
  return useQuery({
    queryKey: queryKeys.jobs.recent(limit),
    queryFn: async (): Promise<RecentJobsResult> => {
      const res = await listAllJobs({ limit });
      return { jobs: res.jobs, total: res.total };
    },
    refetchInterval,
  });
}
