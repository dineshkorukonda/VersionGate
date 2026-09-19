/**
 * Normalize GitHub repository URLs for comparison (HTTPS, SSH, optional .git, owner/repo short forms).
 */
export function normalizeGithubRepoUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";

  const noGit = trimmed.replace(/\/+$/, "").replace(/\.git$/i, "").replace(/\/+$/, "");

  // 1. Check owner/repo pattern (e.g. "dineshkorukonda/carf" or "octocat/Hello-World")
  const ownerRepoMatch = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/.exec(noGit);
  if (ownerRepoMatch && !noGit.includes("://") && !noGit.includes("@") && !noGit.includes(".")) {
    return `https://github.com/${ownerRepoMatch[1]}/${ownerRepoMatch[2]}`.toLowerCase();
  }

  // 2. Check SSH pattern (e.g. "git@github.com:owner/repo" or "ssh://git@github.com/owner/repo" or "git+ssh://...")
  const sshMatch = /^(?:ssh:\/\/|git\+ssh:\/\/)?git@github\.com[:/]([^/]+)\/([^/]+)$/i.exec(noGit);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`.toLowerCase();
  }

  // 3. Check git:// protocol
  const gitProtoMatch = /^git:\/\/github\.com\/([^/]+)\/([^/]+)$/i.exec(noGit);
  if (gitProtoMatch) {
    return `https://github.com/${gitProtoMatch[1]}/${gitProtoMatch[2]}`.toLowerCase();
  }

  // 4. Check standard URL or hostnames (e.g. "github.com/owner/repo" or "https://github.com/owner/repo")
  try {
    const withProto = /^https?:\/\//i.test(noGit) ? noGit : `https://${noGit}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.replace(/^www\./i, "");
    if (host === "github.com") {
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `https://github.com/${parts[0]}/${parts[1]}`.toLowerCase();
      }
      return `https://github.com/${parsed.pathname.replace(/^\/+|\/+$/g, "")}`.toLowerCase();
    }
    return noGit.toLowerCase();
  } catch {
    return noGit.toLowerCase();
  }
}

