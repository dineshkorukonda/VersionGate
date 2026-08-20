# Platform Aesthetics Remodel — Vercel Geist Obsidian Design System

**Date:** 2026-08-20  
**Target:** VersionGate Dashboard & Authentication Interface  
**Aesthetic Theme:** Vercel Geist Obsidian (Pure Vercel / v0 dark aesthetic)

---

## 1. Overview & Objectives

This specification defines the complete visual, layout, and component redesign of VersionGate's dashboard and login interfaces. The remodel upgrades the application from basic dark mode to the **Vercel Geist Obsidian** design system, characterized by:
- Pure `#000000` canvas background with `#0a0a0a` card surfaces and `#1f1f1f` hairline borders.
- Crisp Geist-style typography pairing (`Inter Variable` sans for interface UI / headings, `JetBrains Mono` for hashes, ports, logs, and command tokens).
- Vercel-inspired pill buttons, subtle hairline inputs, high-density data tables, and glowing status micro-badges (`#10b981` active, `#ef4444` failed, `#f59e0b` warning/pending).
- Translucent backdrop-blur navigation headers (`bg-black/80 backdrop-blur-md`) and unified modal sizing.

---

## 2. Design Tokens & Palette

### Color System (`dashboard/src/index.css`)
- **Canvas / Background:** `#000000` (Pure Black)
- **Surfaces & Cards:** `#0a0a0a` (Vercel Dark Surface)
- **Popovers & Modals:** `#0f0f0f` with `1px` border (`#1f1f1f`)
- **Primary Text:** `#ffffff` (`foreground`)
- **Muted Text:** `#888888` (`muted-foreground`)
- **Borders & Dividers:** `#1f1f1f` / `#262626` (Hairline crisp grey)
- **Primary Button CTA:** `#ffffff` background with `#000000` text, hover `#e5e5e5`
- **Secondary Button:** `#0a0a0a` background with `#1f1f1f` border, hover `#171717` and `#ffffff` text
- **Status Indicators:**
  - **Live / Active:** `#10b981` (`emerald-500`) with soft `0 0 8px rgba(16,185,129,0.3)` glow
  - **Building / Deploying:** `#0070f3` (`blue-500` Vercel Blue) with pulse animation
  - **Warning / Action Needed:** `#f59e0b` (`amber-500`)
  - **Failed / Alert:** `#ef4444` (`rose-500`)

### Corner Radius
- **Cards & Modals:** `rounded-xl` (`0.75rem`)
- **Buttons & Inputs:** `rounded-lg` (`0.5rem`)
- **Status Pills:** `rounded-full` (`9999px`)

---

## 3. Component Architecture & Redesign Specs

### 3.1 Authentication Page (`dashboard/src/pages/Login.tsx`)
- **Layout:** Centered Vercel-style card with clean brand badge `[ VERSIONGATE ]`.
- **Title:** "Sign in to VersionGate" with `tracking-tight text-2xl font-semibold`.
- **Inputs:** `#000000` background, `#1f1f1f` border, smooth `focus:border-neutral-500` ring.
- **Buttons:** Solid white primary CTA (`bg-white text-black hover:bg-neutral-200 font-medium h-9 text-xs`).
- **Footer:** Minimal technical links ("Documentation", "Security", "API & Source") with `#888888` muted text.

### 3.2 Main Layout & Navigation (`dashboard/src/components/Layout.tsx`)
- **Header Bar:** Height `48px` sticky top bar (`bg-black/80 backdrop-blur-md border-b border border border-border`).
- **Header Actions:**
  - `[ + ] New project` primary CTA button.
  - Quick links (`Docs`, `API`, `Support`) with hover transition.
  - Search input box (`⌘K` shortcut trigger).
  - Notifications (`[ ALERTS ]`) and User Avatar dropdown.
- **Sidebar:** `240px` dark sidebar with active link indicator (`bg-neutral-900 text-white font-medium`), project section list with `>` icons, and bottom `[ + ] New project` action button.

### 3.3 Dashboard Overview & Project Cards (`Overview.tsx` & `Projects.tsx`)
- **Cluster Stats Bar:** Hairline grid cards displaying `Total Projects`, `Active Containers`, `In Pipeline`, `Failed / Alert`.
- **Project Cards:**
  - `rounded-xl` cards with `#0a0a0a` background and `#1f1f1f` hairline border.
  - Active environment slots (`Slot A`, `Slot B`) with glowing status pills (`LIVE`, `idle`).
  - Quick action buttons (`[ OPEN LIVE APP ]`, `DEPLOY`, `COMPLETE`).

### 3.4 Settings Page Overhaul (`Settings.tsx`)
- **5 Tabs:** `General`, `Network`, `Security`, `Updates`, `Advanced`.
- **Security Tab:** Includes new `Change Administrator Password` card and `API Access Tokens` card.
- **Network Tab:** Includes `Dashboard URL & Hostname`, Nginx site writer, and Certbot SSL manager.
- **Advanced Tab:** Includes `.env` Key-Value editor, runtime health signals, and danger zone.

### 3.5 Modal Dialogs (`dashboard/src/components/ui/dialog.tsx` & `modals/`)
- Default `DialogContent` primitive set to `sm:max-w-lg`.
- Dedicated modals scaled cleanly (`sm:max-w-2xl` for Create Project & Global Search; `sm:max-w-3xl` for Environment Env & System Update).

---

## 4. Verification & Testing

- **Backend Typecheck:** `bun run typecheck` (`tsc --noEmit`)
- **Dashboard Production Build:** `bun run build:dashboard` (`vite build`)
- **Unit Test Suite:** `bun test --pass-with-no-tests` (47/47 passing)
