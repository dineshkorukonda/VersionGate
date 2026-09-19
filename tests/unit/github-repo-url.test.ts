import { describe, test, expect } from "bun:test";
import { normalizeGithubRepoUrl } from "../../src/utils/github/github-repo-url";

describe("GitHub Repository URL Normalizer", () => {
  test("normalizes standard HTTPS repo URL", () => {
    expect(normalizeGithubRepoUrl("https://github.com/dineshkorukonda/carf")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("removes trailing .git and trailing slashes", () => {
    expect(normalizeGithubRepoUrl("https://github.com/dineshkorukonda/carf.git/")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("normalizes SSH format git@github.com:owner/repo.git", () => {
    expect(normalizeGithubRepoUrl("git@github.com:dineshkorukonda/carf.git")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("normalizes git+ssh and ssh protocol prefixes", () => {
    expect(normalizeGithubRepoUrl("git+ssh://git@github.com/dineshkorukonda/carf.git")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
    expect(normalizeGithubRepoUrl("ssh://git@github.com/dineshkorukonda/carf")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("normalizes git:// protocol URLs", () => {
    expect(normalizeGithubRepoUrl("git://github.com/dineshkorukonda/carf.git")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("normalizes short owner/repo format", () => {
    expect(normalizeGithubRepoUrl("dineshkorukonda/carf")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
    expect(normalizeGithubRepoUrl("dineshkorukonda/carf.git")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("normalizes domain without protocol github.com/owner/repo", () => {
    expect(normalizeGithubRepoUrl("github.com/dineshkorukonda/carf")).toBe(
      "https://github.com/dineshkorukonda/carf"
    );
  });

  test("handles empty or whitespace strings gracefully", () => {
    expect(normalizeGithubRepoUrl("")).toBe("");
    expect(normalizeGithubRepoUrl("   ")).toBe("");
  });
});
