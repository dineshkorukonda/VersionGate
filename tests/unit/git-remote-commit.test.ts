import { describe, test, expect } from "bun:test";
import { GitService } from "../../src/services/git.service";

describe("GitService Remote Commit & Auto-Update Engine", () => {
  const gitService = new GitService();

  test("buildAuthUrl injects token into HTTPS GitHub URLs", () => {
    const url = gitService.buildAuthUrl("https://github.com/owner/repo.git", "ghs_mocktoken123");
    expect(url).toBe("https://x-access-token:ghs_mocktoken123@github.com/owner/repo.git");
  });

  test("getRemoteCommitFromRef parses sha from git ls-remote output", () => {
    const stdout = "9f8373b7db8873d6b05423851505c8d022615e9a\trefs/heads/main\n";
    const sha = GitService.parseLsRemoteSha(stdout);
    expect(sha).toBe("9f8373b7db8873d6b05423851505c8d022615e9a");
  });

  test("getRemoteCommitFromRef handles empty or missing refs cleanly", () => {
    const stdout = "\n";
    const sha = GitService.parseLsRemoteSha(stdout);
    expect(sha).toBeNull();
  });
});
