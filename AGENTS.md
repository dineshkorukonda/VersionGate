# AGENTS.md

## Overview

VersionGate is a self-hosted zero-downtime Docker deployment engine with two main components:
- **Backend (Fastify API)** — runs on port 9090 (`bun --watch src/server.ts`)
- **Dashboard (React/Vite)** — runs on port 5173 (`cd dashboard && bun run dev`), proxies `/api` to the backend

---

## Prerequisites (already installed in the environment)

- **Bun** — runtime and package manager for both backend and dashboard
- **PostgreSQL 16** — local instance, database `versiongate`, user `versiongate`/`versiongate`
- **Redis** — event pub/sub and distributed lock manager (port 6379)
- **Docker** — required for the deployment pipeline

---

## Running services

| Service | Command | Port |
|---------|---------|------|
| Backend API | `bun --watch src/server.ts` | 9090 |
| Dashboard dev | `cd dashboard && bun run dev` | 5173 |
| Website dev | `cd website && bun run dev` | 3000 |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 |
| Redis server | `redis-server` / Docker container | 6379 |
| Docker daemon | `sudo dockerd &` | socket |

---

## Architecture & Database Layer

- **ORM:** **Drizzle ORM** with `postgres.js` driver (Drizzle schema located in `src/db/schema.ts` and client in `src/db/client.ts`).
- **Schema Synchronization:** Handled automatically via `src/utils/drizzle-schema-sync.ts` on server boot.
- **Job Queue:** Managed in `src/services/job-queue.ts` using `ioredis` pub/sub and atomic SQL `jsonb` array appends.

---

## Mandatory AI Agent & LLM Guidelines

Whenever an AI Agent or LLM CLI (`agy`, Antigravity, Cursor, Copilot, etc.) works on this codebase, it MUST adhere strictly to the following 8 rules:

1. **Check Existing Files Before Creating New Ones:**
   - Always search existing utility files, components, repositories, and helper functions in `src/` and `dashboard/` before writing custom helper code. Do not duplicate functionality.

2. **Solid & Clean Architecture:**
   - Enforce modularity, clear separation of concerns (Repositories -> Services -> Controllers -> Routes), strict TypeScript typing, and clean code principles.
   - Preserve existing API contracts, function signatures, and docstrings.

3. **Comprehensive Verification & Testing:**
   - NEVER declare success without running verification commands:
     - **Backend Typecheck:** `bun run typecheck` (`bunx tsc --noEmit`)
     - **Dashboard Build:** `bun run build:dashboard`
     - **Backend Tests:** `bun test --pass-with-no-tests`

4. **Strict Semantic Commit Messages:**
   - All commits MUST follow Conventional Commits standard:
     - `feat(...)`: New features
     - `fix(...)`: Bug fixes
     - `perf(...)`: Performance optimizations
     - `refactor(...)`: Refactoring without behavioral change
     - `ci(...)`: CI/CD & pipeline updates
     - `chore(...)`: Maintenance, configs, dependencies

5. **Domain-Driven Feature PR Workflow & Single PR per Milestone:**
   - Work on ONE dedicated feature branch per milestone or discussion session (`feat/*`, `fix/*`, `refactor/*`).
   - Group related full-stack changes (backend engine, dashboard UI, website docs, landing page, and changelog) into atomic commits on the same feature branch.
   - Do NOT open micro-PRs for every individual prompt or minor edit. Open a SINGLE PR when the entire milestone or task scope is complete.
   - ALWAYS assign PRs to `@dineshkorukonda` (`dineshkorukonda`) and attach relevant tags (`enhancement`, `backend`, `frontend`, `infrastructure`, `database`, `bug`).

6. **Automated GitHub Issue Linking & Auto-Closing:**
   - Every PR created MUST list the GitHub issue numbers it resolves in the PR description body using GitHub closing keywords (`Closes #123`, `Fixes #124`, `Resolves #125`) so issues are automatically marked complete upon merging.

7. **Strict No-Emoji & No-Icon Rule:**
   - ABSOLUTELY NO EMOJIS OR DECORATIVE ICON SYMBOLS anywhere across the entire repository (including READMEs, markdown documentation, website UI, dashboard UI, code comments, and commit messages).
   - Use clean, technical text badges (`[ OK ]`, `[ LIVE ]`, `01 //`), monospace typography, and precision layout lines instead.

8. **Mandatory Landing Page & CHANGELOG Updates for Material Features:**
   - Whenever any material feature, high-density change, or major architectural upgrade is introduced (such as reverse proxy stage routing, GitHub App relay, warm-swap rollbacks, or API token authentication), the AI Agent MUST update both:
     a) The marketing website landing page (`website/`) to feature the new capability.
     b) `CHANGELOG.md` in the root repository to maintain an up-to-date, comprehensive record of changes.

---

## Lint / Typecheck / Build Commands

- **Backend typecheck:** `bun run typecheck` (`bunx tsc --noEmit`)
- **Dashboard build:** `bun run build:dashboard`
- **Run tests:** `bun test --pass-with-no-tests`
