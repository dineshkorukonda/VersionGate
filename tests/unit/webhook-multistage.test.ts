import { describe, test, expect } from "bun:test";

describe("Webhook Multi-Stage Branch Routing Logic", () => {
  const environments = [
    { id: "env-prod", name: "production", branch: "main" },
    { id: "env-staging", name: "staging", branch: "staging" },
    { id: "env-dev", name: "development", branch: "dev" },
  ];

  function matchEnvironments(pushedBranch: string, envList: typeof environments) {
    if (!pushedBranch) {
      return envList.filter((e) => e.name === "production");
    }
    return envList.filter((e) => e.branch === pushedBranch);
  }

  test("routes push to main branch to production environment", () => {
    const matched = matchEnvironments("main", environments);
    expect(matched.length).toBe(1);
    expect(matched[0].name).toBe("production");
  });

  test("routes push to staging branch to staging environment", () => {
    const matched = matchEnvironments("staging", environments);
    expect(matched.length).toBe(1);
    expect(matched[0].name).toBe("staging");
  });

  test("routes push to dev branch to development environment", () => {
    const matched = matchEnvironments("dev", environments);
    expect(matched.length).toBe(1);
    expect(matched[0].name).toBe("development");
  });

  test("returns empty array for untracked feature branch", () => {
    const matched = matchEnvironments("feature/random-exp", environments);
    expect(matched.length).toBe(0);
  });
});
