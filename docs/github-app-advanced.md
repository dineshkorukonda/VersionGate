# Advanced: per-instance GitHub App (Phase 2)

> **Status:** Not implemented. Phase 1 uses the **official shared** VersionGate GitHub App with a webhook fan-out relay on [versiongate.tech](https://versiongate.tech).

## Goal

Allow operators who want a fully self-contained VPS (no dependency on versiongate.tech for webhooks) to create their **own** GitHub App from the dashboard.

## Planned approach (Coolify-style)

1. Dashboard → Integrations → **Create my own GitHub App**
2. App Manifest flow (`POST` to GitHub with prefilled permissions + `{PUBLIC_URL}/api/webhooks/github`)
3. Exchange temporary `code` → store App ID, PEM, webhook secret encrypted in DB (`ENCRYPTION_KEY`)
4. Webhooks hit the VPS directly — no fan-out relay
5. Toggle: “Use official VersionGate App” (default) vs “Use my own App”

## Why Phase 1 first

- One App = simpler UX for new users (Connect only)
- Shared webhook URL requires a central relay; that is what Phase 1 ships
- Manifest flow is the right escape hatch for air-gapped / privacy-sensitive installs

See [website/README.md](../website/README.md) for the Phase 1 relay architecture.
