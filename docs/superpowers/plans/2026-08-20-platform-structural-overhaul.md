# VersionGate Platform Structural & Layout Overhaul Implementation Plan

> **Goal:** Execute a complete structural, layout, and component overhaul of the VersionGate platform (Layout header/nav, Overview dashboard, Projects page grid/table, and ProjectDetail workspace) to deliver a modern Vercel / Railway / Cloudflare cloud platform experience.

---

## Task Breakdown

### Task 1: Navigation Architecture & Top Header Overhaul (`Layout.tsx`)
- **File:** `dashboard/src/components/Layout.tsx`
- **Changes:**
  - Build Vercel-style top scope bar: Org/Workspace Switcher (`VersionGate / Personal`), `⌘K Search...` command bar trigger, `+ Deploy Project` CTA, System Status dot (`● Operational`), and user menu.
  - Build sub-header horizontal navigation tab bar (`Overview`, `Projects`, `Activity & Logs`, `Integrations`, `System Telemetry`, `Settings`) with smooth active tab highlights.

### Task 2: Overview Page Telemetry Matrix & Project Cards Matrix (`Overview.tsx`)
- **File:** `dashboard/src/pages/Overview.tsx`
- **Changes:**
  - Build Hero Welcome header & quick import action cards.
  - Build 4-column Telemetry Hero Matrix (`Active Containers`, `Nginx Traffic`, `Host CPU & Memory`, `Deployment Health Rate`).
  - Redesign Project Cards with live git branch tags, clickable live URLs, Blue/Green dual slot badges, and quick actions.
  - Build full-width Live Cluster Activity Feed stream.

### Task 3: Projects Page View Switcher & Dense Data Table (`Projects.tsx`)
- **File:** `dashboard/src/pages/Projects.tsx`
- **Changes:**
  - Build Search, Environment filter (`Production`, `Staging`, `Development`), and View Mode toggle (`Grid` vs `Dense Table`).
  - Build high-density Data Table view component.

### Task 4: Project Detail Workspace & Blue/Green Controller Overhaul (`ProjectDetail.tsx`)
- **File:** `dashboard/src/pages/ProjectDetail.tsx`
- **Changes:**
  - Redesign Project Workspace header with GitHub repo link, production URL button, and `Deploy Latest Commit` CTA.
  - Redesign Blue/Green Traffic Stage Controller card with warm-swap rollback target and 1-click rollback trigger.
  - Build stage sub-tabs (`Production`, `Staging`, `Development`).

### Task 5: Rule #8 Website Landing Page & Web Changelog Update
- **Files:** `website/src/components/capability-grid.tsx`, `website/src/app/changelog/page.tsx`
- **Changes:**
  - Update capability grid with `cap-structuraloverhaul` (`v2.3 Feature`).
  - Add `v2.3.0` release entry in changelog documenting the complete structural layout overhaul.

### Task 6: Comprehensive Verification & Pull Request Management
- **Commands:**
  - `bun run typecheck`
  - `bun test --pass-with-no-tests`
  - `bun run build:dashboard`
  - Git branch: `feat/platform-structural-overhaul` -> PR creation & issue assignment.
