# VersionGate Changelog

All notable changes to VersionGate are documented in this file.
The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

---

## [1.4.0] - 2026-07-29

### Added
- **GitHub App Relay & Custom Manifest Proxy (`feat/github-app-relay-manifest-integration`)**:
  - Implemented automatic relay proxy fallback for self-hosted instances running without local GitHub App private keys (`fetchReposFromRelay`, `fetchBranchesFromRelay`).
  - Added `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`, and `GITHUB_STATE_SECRET` to patchable environment variables.
- **Stage Path URL Reverse Proxy Routing (`feat/stage-path-urls-reverse-proxy`)**:
  - Fastify reverse proxy handler supporting `/p/:projectName/:envName/*` and `/p/:projectName/*` stage routes.
  - Dynamically updates Nginx upstream configuration to route path URLs directly to container ports without exposing raw ports.
- **Instant Warm-Swap Rollbacks (`feat/rollback`)**:
  - Sub-second zero-wait rollback logic reusing local Docker container image caches.
- **API Bearer Tokens (`feat/auth`)**:
  - Persistent SHA-256 hashed API access tokens (`vg_live_...`) for CI/CD pipeline automation.
- **Per-Environment Variable Overrides (`feat/env`)**:
  - Environment-specific runtime environment variables for development, staging, and production.
- **Native Background Health Audit (`feat/monitor`)**:
  - Native engine monitor background service replacing external health dependencies.

### Changed
- **Dashboard Theme & Navigation Overhaul (`feat/vercel-shadcn-theme-overhaul`)**:
  - Redesigned marketing website and management dashboard with Vercel and shadcn design tokens, Poppins typography, and working light/dark mode toggles.
- **URL Hostname Cleaning Engine (`fix/deployed-project-links-hostname-cleaning`)**:
  - Added `cleanHostname` in dashboard utilities to strip malformed schemes, duplicate ports, and request paths.

### Fixed
- **Nginx Permissive Directory Writes (`fix/nginx-write-permissions-eacces`)**: Added safe write helper with sudo fallback.
- **Database Timestamp Null Constraints (`fix/enqueue-job-timestamp-null-constraint`)**: Passed explicit `createdAt` and `updatedAt` Date objects in `enqueueJob` and `DeploymentRepository.create`.
- **Environment Lock SQL Syntax (`fix/environment-lock-date-serialization`)**: Used explicit SQL date arithmetic in `acquireDeployLock` to eliminate driver serialization exceptions.

---

## [1.3.0] - 2026-07-21

### Added
- **Quality Gates & Promotion Pipelines**:
  - Soak gate, custom webhook gate, health check gate, and manual approval gates.
  - Environment chain dashboard visualization.
  - Promotion audit logging and promote-without-rebuild execution.

---

## [1.2.0] - 2026-05-03

### Added
- **Central GitHub App Relay Core**:
  - HMAC-SHA256 signature verification (`X-VG-Relay-Signature`) and fan-out webhook forwarding.
- **Neon & Database Baselining**:
  - Split local vs hosted PostgreSQL migration baselines via Drizzle ORM.

---

## [1.1.0] - 2026-04-22

### Added
- **Initial Self-Hosted Deployment Pipeline**:
  - Multi-stage Docker container builds, atomic Nginx upstream switches, and automated database schema synchronization.
