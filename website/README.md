# VersionGate Marketing Website & Relay

Public marketing landing page, release changelog, interactive documentation, and GitHub App **install + webhook fan-out relay** for [versiongate.tech](https://versiongate.tech).

Built with **Next.js 16**, **React 19**, **Turbopack**, and **Tailwind CSS**, featuring a high-contrast obsidian aesthetic inspired by Dokploy bento architecture.

---

## What's Here

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Dokploy-inspired bento landing page with interactive hero preview |
| `src/app/changelog/page.tsx` | Interactive release changelog with version badges and feature categories |
| `src/app/docs/` | Full platform documentation (Quick-Start, Architecture, Networking, APIs) |
| `src/components/landing/` | Bento feature matrix, ecosystem strip, pipeline showcase, and comparisons |
| `src/app/api/github/callback/route.ts` | GitHub App install callback &rarr; persist mapping &rarr; redirect to VPS |
| `src/app/api/github/register/route.ts` | Signed backup registration from VPS after install |
| `src/app/api/webhooks/github/route.ts` | Official GitHub App webhook &rarr; fan-out to `POST {instance}/api/webhooks/github/relay` |
| `src/lib/install-registry.ts` | Redis / persistent storage: `installation_id &rarr; instanceUrl` |
| `src/lib/relay-crypto.ts` | GitHub HMAC signature verification + hop signing + register tokens |

---

## Local Development

```bash
cd website
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketing site and docs.

### Build Verification

```bash
cd website
bun run build
```

---

## Deployment (Vercel)

Deploy the `website/` directory as the project root on Vercel with the following environment variables:

| Variable | Description |
|----------|-------------|
| `RELAY_SECRET` | Same value as `GITHUB_STATE_SECRET` on every self-hosted engine |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret configured on the official VersionGate GitHub App |
| `UPSTASH_REDIS_REST_URL` | (Optional) Upstash Redis URL for multi-region relay registry |
| `UPSTASH_REDIS_REST_TOKEN` | (Optional) Upstash Redis token |

---

## GitHub App Relay Flow

```
Install: GitHub ──► /api/github/callback ──► Redis SET ──► Redirect to VPS Dashboard
Push:    GitHub ──► /api/webhooks/github ──► Lookup ────► POST VPS /api/webhooks/github/relay
```

---

## Repository

The main engine repository is located at [github.com/dineshkorukonda/VersionGate](https://github.com/dineshkorukonda/VersionGate).
