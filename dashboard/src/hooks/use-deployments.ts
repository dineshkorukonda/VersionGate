import { useQuery } from "@tanstack/react-query";
import { getAllDeployments, type Deployment } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useAllDeployments() {
  return useQuery({
    queryKey: queryKeys.deployments.all,
    queryFn: async (): Promise<Deployment[]> => {
      const res = await getAllDeployments();
      return res.deployments;
    },
    refetchInterval: 12_000,
  });
}
