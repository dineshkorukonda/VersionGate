import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function QuickStart() {
  return (
    <article>
      <Breadcrumb page="Quick Start" />
      <PageTitle>Quick Start</PageTitle>
      <Lead>
        Get VersionGate running on a fresh VPS in under five minutes. You need Bun, Docker,
        PostgreSQL (local or Neon), Nginx, and Git on the host.
      </Lead>

      <H2>1. Clone and install</H2>
      <Code title="terminal">{`git clone https://github.com/dinexh/VersionGate
cd VersionGate
bun install

# Build the dashboard (served by the engine)
cd dashboard && bun install && bun run build && cd ..`}</Code>

      <H2>2. Verify the host</H2>
      <P>
        The preflight check validates Docker, Git, the deployment network, writable project paths,
        and optional Nginx/PM2/SSL readiness before you deploy anything.
      </P>
      <Code title="terminal">{`# Create the deployment network once
docker network create versiongate-net

bun run preflight`}</Code>

      <H2>3. Start the engine</H2>
      <Code title="terminal">{`npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save   # persist across reboots`}</Code>
      <P>
        For development you can run <InlineCode>bun --watch src/server.ts</InlineCode> instead.
      </P>

      <H2>4. Complete the setup wizard</H2>
      <P>
        Open <InlineCode>http://your-server-ip:9090/setup</InlineCode> and enter your PostgreSQL
        connection string, domain (or server IP), and an optional Gemini API key. The wizard writes{" "}
        <InlineCode>.env</InlineCode>, generates an encryption key, runs database migrations, and
        configures Nginx when permissions allow.
      </P>

      <H2>5. Connect GitHub &amp; deploy</H2>
      <P>
        In the dashboard, open <InlineCode>Integrations → Connect GitHub</InlineCode> to install the
        GitHub App. Then create a project, pick a repository and branch, and push — every commit to
        the configured branch triggers a zero-downtime deploy.
      </P>

      <Callout title="No manual .env editing required">
        After the setup wizard finishes, everything else — projects, environments, secrets, HTTPS —
        is managed from the dashboard.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/architecture", label: "Architecture" }}
        secondary={{ href: "/docs/api-reference", label: "API Reference" }}
      />
    </article>
  );
}
