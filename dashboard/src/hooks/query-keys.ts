export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    summary: ["projects", "summary"] as const,
  },
  project: {
    detail: (projectId: string) => ["project", projectId, "detail"] as const,
    deployments: (projectId: string) => ["project", projectId, "deployments"] as const,
    jobs: (projectId: string) => ["project", projectId, "jobs"] as const,
  },
  deployments: {
    all: ["deployments", "all"] as const,
  },
  jobs: {
    recent: (limit: number) => ["jobs", "recent", limit] as const,
  },
} as const;
