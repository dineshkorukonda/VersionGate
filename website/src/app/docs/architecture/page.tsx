import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

const PIPELINE = `POST /api/v1/deploy { projectId }
  │
  ├─ Acquire lock          → 409 if a deploy is already running
  ├─ Git clone / pull      → fetch the configured branch
  ├─ Pick color & port     → ACTIVE=BLUE ? use GREEN : use BLUE
  ├─ DB: DEPLOYING         → crash-safety marker
  ├─ docker build          → versiongate-<name>:<timestamp>
  ├─ docker run            → <name>-blue | <name>-green
  ├─ Health check          → GET :port/health (retries + latency cap)
  │     ├─ PASS → Nginx upstream rewrite + reload
  │     └─ FAIL → stop + rm container, DB: FAILED
  ├─ DB: new=ACTIVE, old=ROLLED_BACK
  ├─ Stop + remove old container
  └─ Release lock (always)`;

const LIFECYCLE = `PENDING → DEPLOYING → ACTIVE
                 │           │
                 └→ FAILED   └→ ROLLED_BACK (after next deploy or rollback)`;

export default function Architecture() {
  return (
    <article>
      <Breadcrumb page="Architecture" />
      <PageTitle>Architecture</PageTitle>
      <Lead>
        VersionGate is a Fastify API plus a background worker, backed by PostgreSQL via Prisma. It
        orchestrates the Docker CLI and rewrites Nginx upstreams to switch traffic atomically.
      </Lead>

      <H2>Deployment pipeline</H2>
      <P>Every deploy runs the same locked, crash-safe sequence:</P>
      <Code title="pipeline">{PIPELINE}</Code>

      <H2>Blue-green slots</H2>
      <P>
        Each environment owns two container slots. The active slot serves traffic on{" "}
        <InlineCode>basePort</InlineCode> or <InlineCode>basePort + 1</InlineCode>; deploys always
        target the idle one. Nginx flips the upstream only after the new container is confirmed
        healthy, so there is no moment where traffic hits a cold or broken build.
      </P>

      <H2>Status lifecycle</H2>
      <Code title="deployment status">{LIFECYCLE}</Code>

      <H2>Crash recovery</H2>
      <P>
        On startup, reconciliation finds any deployment stuck in <InlineCode>DEPLOYING</InlineCode>,
        stops and removes its containers, and marks it <InlineCode>FAILED</InlineCode>. Records
        marked <InlineCode>ACTIVE</InlineCode> are verified against{" "}
        <InlineCode>docker inspect</InlineCode> — if the container is not running, they are marked
        failed too. Only then does the engine accept requests.
      </P>

      <Callout title="Component overview">
        HTTP request → Fastify router → controller → service layer → Prisma (state) + Docker CLI
        (build/run/stop) → Nginx (traffic switch). A job queue with a dedicated worker handles
        long-running deploys and streams logs to the dashboard over WebSockets.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/deployment", label: "Deployment & Promotion" }}
        secondary={{ href: "/docs/networking", label: "Networking" }}
      />
    </article>
  );
}
