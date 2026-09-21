import { useQuery } from "@tanstack/react-query";
import {
  getEngineHealth,
  getPreflight,
  getServerDashboard,
  type EngineHealthReport,
  type PreflightReport,
  type SystemDashboardResponse,
} from "@/lib/api";
import { queryKeys } from "./query-keys";

export type SystemHealthData = {
  preflight: PreflightReport | null;
  dashboard: SystemDashboardResponse | null;
  engineHealth: EngineHealthReport | null;
};

export function useSystemHealth(refetchInterval = 5_000) {
  return useQuery({
    queryKey: queryKeys.system.health,
    queryFn: async (): Promise<SystemHealthData> => {
      const [preflight, dashboard, engineHealth] = await Promise.all([
        getPreflight().catch(() => null),
        getServerDashboard(),
        getEngineHealth().catch(() => null),
      ]);
      return { preflight, dashboard, engineHealth };
    },
    refetchInterval,
  });
}
