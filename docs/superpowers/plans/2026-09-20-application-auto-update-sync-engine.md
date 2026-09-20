# Application Auto-Update & Commit Sync Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and enable full-stack automated updates and commit-driven deployments for both adopted services and VersionGate-managed applications across background polling, remote git change detection, and webhook handlers.

**Architecture:** 
1. Enhance `GitService` to query remote repository commit SHAs via authenticated `git ls-remote` / `git fetch` with GitHub App token resolution, replacing local-only `git log -1`.
2. Introduce an autonomous background polling daemon (`AutoDeployPollService`) running on a configurable interval to continuously detect new commits and trigger zero-downtime blue/green deployments.
3. Support GitHub's default `application/x-www-form-urlencoded` webhook payloads alongside `application/json`, and extract remote URLs automatically during service adoption.

**Tech Stack:** TypeScript, Bun, Fastify, Drizzle ORM, Git CLI, PM2, Docker.

**Spec:** Problem statement and root cause analysis in thread transcript.

## Global Constraints

- Strict No-Emoji & No-Icon Rule: ABSOLUTELY NO EMOJIS OR DECORATIVE ICONS anywhere in code, UI, commits, or documentation. Use `[ OK ]`, `[ LIVE ]`, `01 //`, and monospace badges.
- Clean Architecture: Clear separation of concerns (Repositories -> Services -> Controllers -> Routes).
- Mandatory Verification: `bun run typecheck`, `bun run build:dashboard`, `bun test --pass-with-no-tests`.
- Semantic Commits: All commits must follow conventional commits (`feat(...)`, `fix(...)`, `chore(...)`).

---

### Task 1: Remote Git Commit Inspection in `GitService`

**Files:**
- Modify: `src/services/git.service.ts`
- Test: `tests/unit/git-remote-commit.test.ts`

**Interfaces:**
- Produces: `GitService.getLatestCommit(project, branch?)`: resolves remote commit SHA via `git ls-remote` with token auth when `project.repoUrl` is present, falling back to local git log.
- Produces: `GitService.getRemoteLatestCommit(project, branch?)`: fetches remote HEAD commit SHA directly.

- [ ] **Step 1: Write unit test for remote commit detection and authentication URL building**

```typescript
// tests/unit/git-remote-commit.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/unit/git-remote-commit.test.ts`
Expected: FAIL due to missing `parseLsRemoteSha`.

- [ ] **Step 3: Implement remote commit query in `GitService`**

Implement `parseLsRemoteSha`, `getRemoteLatestCommit`, and update `getLatestCommit` in `src/services/git.service.ts`:
- If `project.repoUrl` is a valid remote (not a local dummy `github.com/local/`), resolve authentication token via `resolveAuthToken(project)`.
- Use `git ls-remote <authUrl> refs/heads/<branch>` to query the exact remote HEAD SHA in milliseconds.
- If remote commit differs from local or if local repo is present, fetch/pull to keep metadata fresh while returning remote SHA.
- If remote check fails (e.g. offline / network timeout), gracefully fall back to local `git log -1`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/unit/git-remote-commit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/git.service.ts tests/unit/git-remote-commit.test.ts
git commit -m "fix(git): query remote commit sha via authenticated ls-remote for auto-deploy sync"
```

---

### Task 2: Autonomous Application Auto-Deploy Background Poller

**Files:**
- Create: `src/services/autodeploy-poll.service.ts`
- Modify: `src/config/env.ts`
- Modify: `src/server.ts`
- Test: `tests/unit/autodeploy-poll.test.ts`

**Interfaces:**
- Produces: `startAutoDeployPoll()`, `stopAutoDeployPoll()`, `kickAutoDeployPoll()`
- Consumes: `statusOverviewService.checkAndSyncAutoDeploy()`

- [ ] **Step 1: Write unit test for auto-deploy poll scheduler**

```typescript
// tests/unit/autodeploy-poll.test.ts
import { describe, test, expect } from "bun:test";
import {
  startAutoDeployPoll,
  stopAutoDeployPoll,
  isAutoDeployPollActive,
} from "../../src/services/autodeploy-poll.service";

describe("AutoDeployPollService", () => {
  test("scheduler starts and stops cleanly without leaking timers", () => {
    stopAutoDeployPoll();
    expect(isAutoDeployPollActive()).toBe(false);

    startAutoDeployPoll(10000);
    expect(isAutoDeployPollActive()).toBe(true);

    stopAutoDeployPoll();
    expect(isAutoDeployPollActive()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/unit/autodeploy-poll.test.ts`
Expected: FAIL due to missing module.

- [ ] **Step 3: Implement `src/services/autodeploy-poll.service.ts` and wire into `src/server.ts`**

1. Create `src/services/autodeploy-poll.service.ts`:
   - Polling loop with timer management and concurrency lock.
   - Calls `statusOverviewService.checkAndSyncAutoDeploy({ forceDeploy: false })`.
   - Logs enqueued deployment jobs when new commits are detected.
2. Update `src/config/env.ts`:
   - Add `autoDeployPollMs: Math.max(0, parseInt(optionalEnv("AUTO_DEPLOY_POLL_MS", "60000"), 10) || 60000)`.
   - Export `autoDeployPollMsLive()`.
3. Update `src/server.ts`:
   - Start `startAutoDeployPoll()` on boot when database is configured.
   - Stop `stopAutoDeployPoll()` on SIGINT/SIGTERM shutdown.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/unit/autodeploy-poll.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/autodeploy-poll.service.ts src/config/env.ts src/server.ts tests/unit/autodeploy-poll.test.ts
git commit -m "feat(autodeploy): add background auto-deploy poller daemon for continuous commit sync"
```

---

### Task 3: Resilient Webhook Ingress (URL-Encoded & Root Aliases)

**Files:**
- Modify: `src/app.ts`
- Modify: `src/controllers/webhook.controller.ts`
- Modify: `src/routes/webhook.routes.ts`
- Test: `tests/unit/webhook-urlencoded.test.ts`

**Interfaces:**
- Consumes: incoming GitHub push webhooks in either `application/json` or `application/x-www-form-urlencoded`
- Produces: properly parsed `ref` and triggers `enqueueJob("DEPLOY", project.id, {}, targetEnv.id)`

- [ ] **Step 1: Write unit test for webhook body parsing with urlencoded fallback**

```typescript
// tests/unit/webhook-urlencoded.test.ts
import { describe, test, expect } from "bun:test";
import { parsePushPayload } from "../../src/controllers/webhook.controller";

describe("Webhook Ingress Parsing", () => {
  test("parses JSON payload", () => {
    const raw = JSON.stringify({ ref: "refs/heads/main" });
    const parsed = parsePushPayload(raw, "application/json");
    expect(parsed?.ref).toBe("refs/heads/main");
  });

  test("parses GitHub x-www-form-urlencoded payload", () => {
    const innerJson = JSON.stringify({ ref: "refs/heads/production" });
    const raw = `payload=${encodeURIComponent(innerJson)}`;
    const parsed = parsePushPayload(raw, "application/x-www-form-urlencoded");
    expect(parsed?.ref).toBe("refs/heads/production");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/unit/webhook-urlencoded.test.ts`
Expected: FAIL due to missing `parsePushPayload`.

- [ ] **Step 3: Implement resilient webhook payload parsing and register root `/webhooks/:secret` route**

1. In `src/controllers/webhook.controller.ts`:
   - Export helper `parsePushPayload(rawTextOrBody, contentType)`.
   - If payload is string or urlencoded `payload=...`, decode and parse JSON.
2. In `src/app.ts`:
   - Register root webhook routes `/webhooks/:secret` alongside `/api/webhooks/:secret` and `/api/v1/webhooks/:secret`.
   - Update `preParsing` hook to capture raw body for `/webhooks/` without `/api` prefix.
3. In `src/middleware/require-api-auth.ts`:
   - Allow `/webhooks/` root paths in `isPublicApiPath`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/unit/webhook-urlencoded.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app.ts src/controllers/webhook.controller.ts src/routes/webhook.routes.ts src/middleware/require-api-auth.ts tests/unit/webhook-urlencoded.test.ts
git commit -m "fix(webhook): support urlencoded github payload and register root webhook routes"
```

---

### Task 4: Adopted Service Git Remote Ingestion & Baseline Commit Tracking

**Files:**
- Modify: `src/services/service-discovery.service.ts`
- Test: `tests/unit/service-discovery-git-remote.test.ts`

**Interfaces:**
- Produces: `extractGitRemoteUrl(dir)`: reads `git -C <dir> remote get-url origin` during service discovery/adoption.
- Produces: initial deployment with `commitSha` populated from local git HEAD on adoption.

- [ ] **Step 1: Write unit test for extracting git remote URL during adoption**

```typescript
// tests/unit/service-discovery-git-remote.test.ts
import { describe, test, expect } from "bun:test";
import { ServiceDiscoveryService } from "../../src/services/service-discovery.service";

describe("Service Discovery Git Remote Extraction", () => {
  const service = new ServiceDiscoveryService();

  test("service discovery class exposes extractGitRemote method", () => {
    expect(typeof (service as any).extractGitRemote).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/unit/service-discovery-git-remote.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement git remote URL extraction and initial commit tracking in adoption flow**

1. In `src/services/service-discovery.service.ts`:
   - Add `extractGitRemote(localPath: string): Promise<string | null>` using `git -C <dir> config --get remote.origin.url`.
   - During `adoptService`, if `!input.repoUrl`, try to extract remote URL from `localPath`.
   - Normalize the extracted git URL via `normalizeGithubRepoUrl`.
   - Query latest commit from `localPath` to populate initial deployment `commitSha`, ensuring commit sync baseline is established immediately.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/unit/service-discovery-git-remote.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/service-discovery.service.ts tests/unit/service-discovery-git-remote.test.ts
git commit -m "fix(discovery): auto-detect git remote url and track baseline commit on service adoption"
```

---

### Task 5: Marketing Website Landing Page & Changelog Documentation

**Files:**
- Modify: `website/src/components/capability-grid.tsx`
- Modify: `website/src/app/changelog/page.tsx`

**Constraints:**
- Strictly follow Rule 7: NO EMOJIS OR ICONS.
- Strictly follow Rule 8: Update capability grid and interactive web changelog for v3.3.0.

- [ ] **Step 1: Update `website/src/components/capability-grid.tsx`**
Add/update capability card explaining the autonomous background commit polling daemon, remote git ls-remote resolution, and dual format webhook ingress.

- [ ] **Step 2: Update `website/src/app/changelog/page.tsx`**
Add release v3.3.0 detailing:
- Remote Git commit resolution using `git ls-remote` with GitHub App token auth.
- Autonomous background application auto-deploy poller daemon.
- GitHub default `application/x-www-form-urlencoded` push webhook parsing and root route aliases.
- Adopted service remote Git URL auto-detection and baseline commit tracking.

- [ ] **Step 3: Run verification commands**

Run:
1. `bun run typecheck`
2. `bun run build:dashboard`
3. `cd website && bun run build`
4. `bun test --pass-with-no-tests`

- [ ] **Step 4: Commit**

```bash
git add website/src/components/capability-grid.tsx website/src/app/changelog/page.tsx
git commit -m "docs(changelog): record autonomous auto-deploy polling engine, remote git ls-remote, and webhook fixes"
```
