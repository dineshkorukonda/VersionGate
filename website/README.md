# VersionGate marketing site

Public landing page and GitHub App install relay for [versiongate.tech](https://versiongate.tech).

Lives in the same repo as the deployment engine so marketing copy stays in sync with dashboard features.

## What's here

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page (features, install steps, dashboard preview) |
| `src/app/api/github/callback/route.ts` | GitHub App OAuth relay → self-hosted instances |
| `src/lib/github-install-state.ts` | State parser (must match engine `src/utils/github-install-state.ts`) |

## Development

```bash
cd website
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Deploy the `website/` directory as the project root on Vercel.

Environment variable:

| Variable | Description |
|----------|-------------|
| `RELAY_SECRET` | Same value as `GITHUB_STATE_SECRET` on self-hosted engine instances |

## GitHub App relay

Self-hosted instances use a **fixed** GitHub App callback URL:

```
https://versiongate.tech/api/github/callback
```

Flow: user installs app → GitHub redirects here → relay verifies signed `state` → redirects to `{PUBLIC_URL}/api/auth/github/callback` on the user's instance.

The engine repo is at [github.com/dinexh/VersionGate](https://github.com/dinexh/VersionGate).
