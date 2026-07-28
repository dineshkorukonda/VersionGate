import { describe, test, expect } from "bun:test";
import { publicStageUrl, publicEnvironmentUrl } from "../../dashboard/src/lib/deployment-display";

describe("Stage Reverse Proxy URL Resolution", () => {
  test("publicStageUrl generates correct path-based stage URLs", () => {
    const url = publicStageUrl("my-app", "production", "example.com");
    expect(url).toContain("/p/my-app/production");
    expect(url).toContain("example.com");
  });

  test("publicStageUrl handles staging and development environments", () => {
    const stagingUrl = publicStageUrl("my-app", "staging", "example.com");
    expect(stagingUrl).toContain("/p/my-app/staging");

    const devUrl = publicStageUrl("my-app", "development", "example.com");
    expect(devUrl).toContain("/p/my-app/development");
  });

  test("publicEnvironmentUrl defaults to path URL when project is specified", () => {
    const url = publicEnvironmentUrl({ name: "demo-api", basePort: 3000 }, "staging", 3200);
    expect(url).toContain("/p/demo-api/staging");
  });

  test("publicEnvironmentUrl falls back to direct port when preferPath is false", () => {
    const url = publicEnvironmentUrl({ name: "demo-api", basePort: 3000 }, "staging", 3200, false);
    expect(url).toContain(":3200");
  });
});
