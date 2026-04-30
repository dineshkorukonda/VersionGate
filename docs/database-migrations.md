# Database migrations (production & Neon)

This runbook supports [issue #51](https://github.com/dineshkorukonda/VersionGate/issues/51): predictable `**prisma migrate deploy**` in production, Neon pooler quirks, and when to use `**PRISMA_SCHEMA_SYNC**`.

## How VersionGate applies schema changes

On startup (when `DATABASE_URL` is set), the engine runs schema sync from `[src/utils/prisma-schema-sync.ts](../src/utils/prisma-schema-sync.ts)`:


| `PRISMA_SCHEMA_SYNC` | Behavior                                                                                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrate` (default)  | Runs `bunx prisma migrate deploy` (uses `**DIRECT_DATABASE_URL**` as `DATABASE_URL` for that subprocess when set — see Neon below). On some failures it falls back to `db push`. **No fallback** on P3005 / P3009 / P1001 / P1002 / baseline / advisory-lock errors. |
| `push`               | Runs **only** `bunx prisma db push --accept-data-loss` — no migration history required. Use only when you accept push-only discipline for that install.                                                                                                              |


Set in `.env`:

```bash
# migrate | push — default migrate
PRISMA_SCHEMA_SYNC=migrate
```

The `[install.sh](../install.sh)` script honors the same variable when provisioning the database.

## Error P3005 — “database schema is not empty” / no baseline

Prisma Migrate expects either an empty database or an existing `_prisma_migrations` table that matches the migration folder. If the database was created with `**db push**` or manual SQL, `**migrate deploy**` can fail with **P3005**.

**Fix — baseline (recommended for production):**

1. Ensure the **live** database schema matches what your migration history describes (or adjust migrations first — do not baseline over unknown drift).
2. Follow Prisma’s guide: [Baselining a database](https://www.prisma.io/docs/guides/migrate/developing-and-production/prototyping-schema-baseline) — mark existing migrations as already applied without re-running them (`prisma migrate resolve` / baseline workflow for your Prisma version).
3. Run `prisma migrate deploy` against that database and confirm it exits `0`.

After baselining, keep using **versioned migrations** for all future schema changes.

**Alternative — push-only installs:**

If you intentionally do not use migration history (e.g. ephemeral dev), set `PRISMA_SCHEMA_SYNC=push`. Startup will skip `migrate deploy` and use `**db push`** only. This is weaker for multi-environment discipline and is **not** recommended for regulated production unless you accept that tradeoff.

## Error P3009 — “migrate found failed migrations in the target database”

Prisma records each migration in `_prisma_migrations`. If a migration **started** but did not finish cleanly, Prisma marks it as **failed** and refuses to apply newer migrations until you **resolve** that record ([production troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)).

**You must not blindly “resolve” without checking the live schema** — choose the branch that matches reality.

### 1. Inspect the database

From the server (or any host that can reach the DB), with the same URL VersionGate uses for migrations (prefer `**DIRECT_DATABASE_URL`** unpooled if you use Neon):

```bash
# Example: use direct URL for CLI if pooler causes lock issues
export DATABASE_URL="postgresql://…"
bunx prisma migrate status
```

In `psql`, confirm whether the `**Environment**` table exists, whether `**Deployment**` has `**environmentId**` (and no `**projectId**`), etc. Compare that to what the failed migration `[20260419120000_environment_model](../../prisma/migrations/20260419120000_environment_model/migration.sql)` was supposed to do.

### 2a. Migration actually completed (schema matches “applied”)

If the DDL from the failed migration is already in place (e.g. `Environment` exists, `Deployment` is wired to environments), tell Prisma to mark it applied so history moves forward:

```bash
bunx prisma migrate resolve --applied 20260419120000_environment_model
bunx prisma migrate deploy
```

### 2b. Migration did not complete (schema still old or broken)

If the database was rolled back or left inconsistent:

1. **Repair** the schema manually (SQL or restore from backup) until it matches either the pre-migration state or the fully migrated state — follow your DR process; do not run `migrate deploy` on a half-applied production DB without understanding the gap.
2. If you are back to a clean pre-migration state and Prisma still lists the migration as failed, mark it rolled back, fix the underlying cause (connection timeout, wrong URL, etc.), then redeploy:

```bash
bunx prisma migrate resolve --rolled-back 20260419120000_environment_model
bunx prisma migrate deploy
```

If the schema is **partially** migrated, prefer restoring from backup or hand-fixing tables/constraints to a known good state, then use `**--applied`** or `**--rolled-back**` consistently with that state. When in doubt, take a fresh backup before `resolve`.

### 3. Retry self-update / startup

After `migrate deploy` exits `0`, dashboard **Update and restart PM2** (or API restart) can run `prisma generate` and builds again without hitting P3009.

Setting `PRISMA_SCHEMA_SYNC=push` skips `migrate deploy` but does **not** clear failed rows in `_prisma_migrations`; if you later switch back to `migrate`, run `**migrate resolve`** first so history is consistent.

## Neon: pooler timeouts and advisory locks

VersionGate reads optional `**DIRECT_DATABASE_URL**` from `.env`. When present, `**prisma migrate deploy**` (startup and self-update) runs with `DATABASE_URL` temporarily set to that value so Prisma can acquire **PostgreSQL advisory locks** reliably. The running API and Prisma client continue to use the normal pooled `**DATABASE_URL`**.

Add the direct connection string from the Neon console (non-pooler / `-direct` host). You can edit it in **Settings → Update server environment** on the dashboard.

Neon (and similar poolers) often expose:

- A **pooled** URL (good for app concurrency).
- A **direct** URL (session mode / non-pooler), better for operations that need **advisory locks**, including some `**prisma migrate`** workloads.

If `**migrate deploy**` hangs or fails with connection pool / lock errors while the app runs fine:

1. In the Neon console, copy the **direct** connection string for migrations.
2. Run migrations manually with that URL, **or** temporarily point `DATABASE_URL` at the direct URL **only** for the migration step / first boot, then revert to the pooler URL for steady-state traffic if your deployment model allows.

Example (manual one-shot):

```bash
DATABASE_URL="postgresql://…@…-direct.neon.tech/neondb?sslmode=require" bunx prisma migrate deploy
```

Operational pattern many teams use:

- `**DATABASE_URL**` — pooled URL for the running engine.
- `**DIRECT_DATABASE_URL**` — direct (non-pooler) URL stored in `.env`; VersionGate uses it **only** as `DATABASE_URL` for the `prisma migrate deploy` subprocess during startup and self-update (see `[prisma-schema-sync.ts](../src/utils/prisma-schema-sync.ts)`). You can also export it manually for one-off `bunx prisma migrate deploy` / `migrate resolve` from SSH.

Document whichever approach you choose in your internal runbook so production and staging stay consistent.

## Reducing noisy fallback warnings

If logs show `**migrate deploy failed — falling back to prisma db push`**:

1. Prefer **baselining** (above) so `migrate deploy` succeeds.
2. Or set `**PRISMA_SCHEMA_SYNC=push`** explicitly if this install is intentionally push-only — then startup logs reflect policy instead of a failed migrate attempt.

If you see `**Not using db push fallback**` with **P3005**, you must baseline (or use an empty database) — do not expect `db push` to fix it after a failed self-update.

## References

- [Prisma: Baselining](https://www.prisma.io/docs/guides/migrate/developing-and-production/prototyping-schema-baseline)
- [Prisma: Production troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- VersionGate issue tracker: **#51** — production migrate baselining, Neon, optional split store

