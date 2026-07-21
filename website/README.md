# VersionGate marketing site

Public landing page and GitHub App **install + webhook fan-out relay** for [versiongate.tech](https://versiongate.tech).

Lives in the same repo as the deployment engine so marketing copy stays in sync with dashboard features.

## What's here

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page |
| `src/app/api/github/callback/route.ts` | Install callback → persist mapping → redirect to VPS |
| `src/app/api/github/register/route.ts` | Signed backup registration from VPS after install |
| `src/app/api/webhooks/github/route.ts` | Official App webhook → fan-out to `POST {instance}/api/webhooks/github/relay` |
| `src/lib/install-registry.ts` | Upstash Redis: `installation_id → instanceUrl` |
| `src/lib/github-install-state.ts` | Install `state` parser (must match engine) |
| `src/lib/relay-crypto.ts` | GitHub sig verify + hop signatures + register tokens |

## Development

```bash
cd website
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Deploy the `website/` directory as the project root on Vercel.

Add an **Upstash Redis** store from the Vercel Marketplace and set:

| Variable | Description |
|----------|-------------|
| `RELAY_SECRET` | Same value as `GITHUB_STATE_SECRET` on every self-hosted engine |
| `GITHUB_WEBHOOK_SECRET` | Same webhook secret as the official VersionGate GitHub App |
| `UPSTASH_REDIS_REST_URL` | From Upstash / Vercel Redis integration |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash / Vercel Redis integration |

## Official GitHub App (ops checklist)

On [github.com/apps/VersionGate-App](https://github.com/apps/VersionGate-App) → settings:

1. **Callback URL:** `https://versiongate.tech/api/github/callback`
2. **Webhook URL:** `https://versiongate.tech/api/webhooks/github` (not per-VPS)
3. Subscribe to: `push`, `installation`, `installation_repositories`, `ping`
4. Permissions: Contents (read), Metadata (read) — plus any already required for repo listing

### E2E smoke test

1. Set `PUBLIC_URL` + shared App env + `GITHUB_STATE_SECRET` on a VPS
2. Dashboard → Integrations → Connect GitHub → install on a test repo
3. Confirm Redis key `vg:install:{id}` exists
4. Push to the project branch → relay logs fan-out → VPS enqueues deploy

## GitHub App relay flow

```
Install:  GitHub → /api/github/callback → Redis SET → redirect to VPS
Push:     GitHub → /api/webhooks/github → lookup → POST VPS /api/webhooks/github/relay
```

## Phase 2 (not implemented yet)

Advanced users may later create a **per-instance** GitHub App via the App Manifest flow (Coolify-style), with webhook URL `{PUBLIC_URL}/api/webhooks/github` and no dependency on this relay. Tracked as a follow-up; Phase 1 is shared App only.

The engine repo is at [github.com/dinexh/VersionGate](https://github.com/dinexh/VersionGate).
