# VersionGate Platform Structural & Layout Overhaul Design Spec

## Overview
This design specification defines the complete structural and layout overhaul of the VersionGate platform dashboard. Moving beyond simple color and CSS token updates, this overhaul restructures the core navigation architecture, header bar, overview dashboard, project list management, and project detail workspace to match modern Vercel, Railway, and Cloudflare platform standards.

---

## 1. Core Architecture & Navigation System (`dashboard/src/components/Layout.tsx`)

### 1.1 Top Scope Bar (Vercel Platform Header)
- **Left Scope Switcher:** Displays `VersionGate / Personal Workspace` with a project search shortcut.
- **Center Command Bar Trigger:** Quick `⌘K Search projects, logs, settings...` command palette input.
- **Right Quick Action Bar:**
  - `+ Deploy Project` primary CTA button.
  - Live system status pill (`● Operational`).
  - User profile menu with quick account controls and sign-out.

### 1.2 Sub-Header Horizontal Navigation Bar
- Standardized horizontal tab bar situated immediately beneath the top header:
  - `Overview` (`/`)
  - `Projects` (`/projects`)
  - `Activity & Logs` (`/activity`)
  - `Integrations` (`/integrations`)
  - `System Telemetry` (`/system-health`)
  - `Settings` (`/settings`)

---

## 2. Overview Page Overhaul (`dashboard/src/pages/Overview.tsx`)

### 2.1 Hero Welcome & Quick Action Header
- Personal greeting header ("Welcome back, Administrator").
- Action bar with quick import CTAs: `Import Git Repo`, `Deploy CLI`, `System Health`.

### 2.2 Telemetry Hero Matrix Grid
- 4-column metric panel:
  - `Active Containers` (Total running Docker instances)
  - `Nginx Traffic` (Upstream requests/sec)
  - `Host CPU & Memory` (Live resource usage)
  - `Deployment Health Rate` (Percentage of successful deployments)

### 2.3 Interactive Project Cards Matrix
- Enhanced project cards featuring:
  - **Git Repo & Commit:** Repository link badge, active branch (`main · 7a8b9c`), and relative deployment timestamp.
  - **Live URL Pill:** Direct clickable production link (`my-app.versiongate.tech`) with external link icon.
  - **Blue/Green Dual Slot Matrix:** Explicit status badges (`Slot A: LIVE :3000` | `Slot B: IDLE :3001`).
  - **Quick Action Bar:** `Deploy Now`, `Logs`, `Rollback`, `Settings`.

### 2.4 Live Cluster Activity Stream
- Streaming audit log panel showing recent deployment jobs, container warm-swaps, and system events.

---

## 3. Projects Page Structural Overhaul (`dashboard/src/pages/Projects.tsx`)

### 3.1 Search, Filter & View Controls
- Search bar filtering by project name or git repository.
- Environment dropdown filter (`All Environments`, `Production`, `Staging`, `Development`).
- View Mode Toggle: **Grid Cards View** vs **Dense Data Table View**.

### 3.2 Dense Data Table View
- High-density table columns:
  `Project Name` | `Repository & Branch` | `Active Stage` | `Live URL` | `Status` | `Last Deployed` | `Actions`

---

## 4. Project Detail Page Overhaul (`dashboard/src/pages/ProjectDetail.tsx`)

### 4.1 Project Workspace Hero Header
- Large project title, GitHub repository link badge, active production URL button, and primary `Deploy Latest Commit` CTA.

### 4.2 Blue/Green Traffic Stage Controller
- Prominent traffic routing card displaying active slot (`BLUE` / `GREEN`), warm-swap rollback target, Nginx upstream port, and 1-click `Instant Rollback` button.

### 4.3 Multi-Stage Tabs (`Production` | `Staging` | `Development`)
- Stage-specific deployment history, environment variable overrides, and reverse proxy routing paths.

### 4.4 Monospace Log Viewer Terminal
- Full dark terminal container with live WebSocket log streaming, log search filter, export logs, and full-screen toggle.
