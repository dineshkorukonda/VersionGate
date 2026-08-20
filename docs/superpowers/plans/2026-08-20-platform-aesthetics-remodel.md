# Vercel Geist Obsidian Platform Aesthetic Remodel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the VersionGate dashboard and login UI into the Vercel Geist Obsidian design system with pure `#000000` obsidian canvas backgrounds, `#0a0a0a` hairline cards, Geist-inspired typography, and solid white CTAs.

**Architecture:** Update global Tailwind CSS theme variables, standardize component primitives (Buttons, Cards, Inputs, Badges, Tabs, Dialogs), and overhaul page layouts (Login, Layout header/sidebar, Overview, Projects, Project Detail, Settings, Activity, Integrations, System Health).

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Base UI Dialog primitives, Sonner toasts.

**Spec:** [docs/superpowers/specs/2026-08-20-platform-aesthetics-remodel-design.md](file:///C:/Users/dines/Developer/VersionGate/docs/superpowers/specs/2026-08-20-platform-aesthetics-remodel-design.md)

## Global Constraints

- ABSOLUTELY NO EMOJIS OR DECORATIVE ICON SYMBOLS (AGENTS.md Rule #7). Use clean text badges (`[ OK ]`, `[ LIVE ]`, `[ SYNC ]`).
- All code modifications MUST pass `bun run typecheck`, `bun test --pass-with-no-tests`, and `bun run build:dashboard`.
- Keep conventional commit messages (`feat(dashboard): ...`, `fix(ui): ...`).

---

### Task 1: Global Vercel Theme CSS Tokens & Variables

**Files:**
- Modify: `dashboard/src/index.css`

**Interfaces:**
- Consumes: Tailwind v4 theme variables
- Produces: CSS color variables for Vercel dark canvas (`--background: #000000`, `--surface: #0a0a0a`, `--card: #0a0a0a`, `--border: #1f1f1f`, `--foreground: #ffffff`, `--muted-foreground: #888888`)

- [ ] **Step 1: Inspect and update index.css variables**

Update `dashboard/src/index.css` `:root` variables to use Vercel Geist Obsidian tokens:
```css
:root {
  --background: #000000;
  --foreground: #ffffff;
  --surface: #0a0a0a;  
  --card: #0a0a0a;
  --card-foreground: #ffffff;
  --popover: #0f0f0f;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #171717;
  --secondary-foreground: #a1a1a1;
  --muted: #171717;
  --muted-foreground: #888888;
  --accent: #171717;
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #1f1f1f;
  --input: #1a1a1a;
  --ring: #333333;
  --radius: 0.5rem;
  --sidebar: #0a0a0a;
  --sidebar-foreground: #888888;
  --sidebar-primary: #ffffff;
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: #171717;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: #1f1f1f;
  --sidebar-ring: #333333;
}
```

- [ ] **Step 2: Run build and typecheck verification**

Run: `bun run typecheck && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/index.css
git commit -m "feat(ui): update index.css to Vercel Geist Obsidian design tokens"
```

---

### Task 2: Standardize Vercel UI Component Primitives

**Files:**
- Modify: `dashboard/src/components/ui/button.tsx`
- Modify: `dashboard/src/components/ui/card.tsx`
- Modify: `dashboard/src/components/ui/input.tsx`
- Modify: `dashboard/src/components/ui/badge.tsx`
- Modify: `dashboard/src/components/ui/tabs.tsx`

**Interfaces:**
- Consumes: Tailwind `cn` utility, buttonVariants
- Produces: Standardized Vercel UI primitives across dashboard

- [ ] **Step 1: Update Button styles in button.tsx**

Update `buttonVariants` default:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-200 font-semibold shadow-sm",
        destructive: "bg-rose-600 text-white hover:bg-rose-500 shadow-sm",
        outline: "border border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-900 hover:text-white",
        secondary: "bg-neutral-900 text-neutral-200 border border-neutral-800 hover:bg-neutral-800 hover:text-white",
        ghost: "hover:bg-neutral-900 text-neutral-400 hover:text-white",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

- [ ] **Step 2: Update Card styling in card.tsx**

Update Card base classes to `rounded-xl border border-neutral-800 bg-[#0a0a0a] text-white shadow-sm`.

- [ ] **Step 3: Update Input styling in input.tsx**

Update Input base classes to `h-9 w-full rounded-lg border border-neutral-800 bg-black px-3 py-1 text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500 outline-none`.

- [ ] **Step 4: Update Badge styling in badge.tsx**

Update Badge base classes to `inline-flex items-center rounded-full border border-neutral-800 px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors`.

- [ ] **Step 5: Run verification**

Run: `bun run typecheck && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/components/ui/
git commit -m "feat(ui): update UI component primitives to Vercel Geist aesthetic"
```

---

### Task 3: Translucent Navigation Header & Vercel Sidebar Layout

**Files:**
- Modify: `dashboard/src/components/Layout.tsx`

**Interfaces:**
- Consumes: Navigation router, SidebarProvider, GlobalSearchDialog, CreateProjectModal
- Produces: Translucent top navigation bar and Vercel sidebar layout

- [ ] **Step 1: Refactor Layout header bar**

Update header bar element:
```tsx
<header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-neutral-800 bg-black/80 backdrop-blur-md px-4">
```

- [ ] **Step 2: Refactor sidebar menu items**

Update active sidebar link styling to `bg-neutral-900 text-white font-medium border-l-2 border-white`.

- [ ] **Step 3: Verify build**

Run: `bun run typecheck && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/Layout.tsx
git commit -m "feat(dashboard): refactor top header and sidebar to Vercel backdrop-blur aesthetic"
```

---

### Task 4: Authentication & Login Page Redesign

**Files:**
- Modify: `dashboard/src/pages/Login.tsx`

**Interfaces:**
- Consumes: authLogin, authRegister, getAuthStatus from `@/lib/api`
- Produces: Vercel Geist centered login card with full-width primary CTA

- [ ] **Step 1: Update Login.tsx layout and card styling**

Refactor centered container to use clean `[ VERSIONGATE ]` text pill, sentence-case title "Sign in to VersionGate", hairline inputs, and solid white primary submit button (`bg-white text-black hover:bg-neutral-200 w-full h-9 font-semibold`).

- [ ] **Step 2: Verify build**

Run: `bun run typecheck && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/pages/Login.tsx
git commit -m "feat(dashboard): redesign Login page to Vercel Geist card aesthetic"
```

---

### Task 5: Dashboard Overview & Projects List Remodel

**Files:**
- Modify: `dashboard/src/pages/Overview.tsx`
- Modify: `dashboard/src/pages/Projects.tsx`

**Interfaces:**
- Consumes: getProjects, getOverviewMetrics, ProjectCard
- Produces: Hairline overview stat metrics, active project card grid with Vercel status indicators

- [ ] **Step 1: Refactor Overview.tsx metrics grid**

Update stats cards to hairline border cards with muted uppercase labels and crisp white numbers (`text-2xl font-bold font-mono`).

- [ ] **Step 2: Refactor Projects.tsx cards**

Update project cards to `bg-[#0a0a0a] border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all` with glowing status pills (`LIVE`, `idle`).

- [ ] **Step 3: Verify build and unit tests**

Run: `bun run typecheck && bun test --pass-with-no-tests && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/pages/Overview.tsx dashboard/src/pages/Projects.tsx
git commit -m "feat(dashboard): overhaul Overview and Projects pages to Vercel card layout"
```

---

### Task 6: Project Detail, Activity, Integrations & System Health Overhaul

**Files:**
- Modify: `dashboard/src/pages/ProjectDetail.tsx`
- Modify: `dashboard/src/pages/Activity.tsx`
- Modify: `dashboard/src/pages/Integrations.tsx`
- Modify: `dashboard/src/pages/SystemHealth.tsx`

**Interfaces:**
- Consumes: Deployment timeline, Docker container status, GitHub App relay config, System metrics
- Produces: Polished sub-pages with hairline card borders, monospace log viewers, and dark gauge metrics

- [ ] **Step 1: Refactor ProjectDetail.tsx tabs and deployment stream cards**

Update tab triggers and deployment log container styling to obsidian dark terminal background (`bg-[#050505] border border-neutral-800 font-mono text-xs text-neutral-300`).

- [ ] **Step 2: Refactor Activity, Integrations, and SystemHealth pages**

Apply Vercel Geist Obsidian card borders, hairline table dividers, and micro status pills.

- [ ] **Step 3: Run full verification suite**

Run: `bun run typecheck && bun test --pass-with-no-tests && bun run build:dashboard`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/pages/
git commit -m "feat(dashboard): polish ProjectDetail, Activity, Integrations and SystemHealth to Geist aesthetic"
```

---

### Task 7: Comprehensive Suite Verification & Final Commit

- [ ] **Step 1: Run complete typecheck**
Run: `bun run typecheck`  
Expected: Code 0, 0 errors.

- [ ] **Step 2: Run full backend unit tests**
Run: `bun test --pass-with-no-tests`  
Expected: Code 0, 47/47 passing.

- [ ] **Step 3: Run dashboard production build**
Run: `bun run build:dashboard`  
Expected: Code 0, Vite build clean.
