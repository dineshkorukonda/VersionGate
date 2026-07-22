import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function QuickStart() {
  return (
    <article>
      <Breadcrumb page="Quick Start" />
      <PageTitle>Quick Start</PageTitle>
      <Lead>
        Get VersionGate running on a fresh Ubuntu/Debian VPS. The bootstrap script installs Docker,
        creates the deploy network, and sets up nginx — then you build, preflight, and open the setup
        wizard.
      </Lead>

      <H2>1. Clone the repo</H2>
      <Code title="terminal">{`git clone https://github.com/dinexh/VersionGate
cd VersionGate`}</Code>

      <H2>2. Bootstrap the host (Ubuntu/Debian)</H2>
      <P>
        On a clean VM this installs Docker, adds your user to the <InlineCode>docker</InlineCode>{" "}
        group, creates <InlineCode>versiongate-net</InlineCode>, creates{" "}
        <InlineCode>/var/versiongate/projects</InlineCode>, and installs nginx / certbot / PM2.
      </P>
      <Code title="terminal">{`sudo bash scripts/bootstrap-host.sh
# or: sudo npm run bootstrap-host
# options: --minimal | --with-postgres | --skip-docker

newgrp docker          # apply docker group (or log out/in)
npm run check-deps     # should pass required checks`}</Code>
      <Callout title="Already have Docker?">
        You can skip bootstrap and only run <InlineCode>npm run check-deps</InlineCode>, then fix
        anything marked <InlineCode>[NO]</InlineCode>. Full host validation after install is{" "}
        <InlineCode>bun run preflight</InlineCode>.
      </Callout>

      <H2>3. Install packages &amp; build the dashboard</H2>
      <Code title="terminal">{`bun install
cd dashboard && bun install && bun run build && cd ..
bun run preflight`}</Code>
      <P>
        Preflight validates Bun, Docker, the deploy network, writable project paths, and optional
        Nginx/PM2/SSL readiness. Fix any <InlineCode>[NO]</InlineCode> required items before
        continuing.
      </P>

      <H2>4. Start the engine</H2>
      <Code title="terminal">{`# Production
pm2 start ecosystem.config.cjs
pm2 save

# Development
bun --watch src/server.ts`}</Code>

      <H2>5. Complete the setup wizard</H2>
      <P>
        Open <InlineCode>http://your-server-ip:9090/setup</InlineCode> and enter your PostgreSQL
        connection string, domain (or server IP), and an optional Gemini API key. The wizard writes{" "}
        <InlineCode>.env</InlineCode>, generates an encryption key, runs database migrations, and
        configures Nginx when permissions allow.
      </P>

      <H2>6. Connect GitHub &amp; deploy</H2>
      <P>
        Paste the official shared GitHub App credentials into <InlineCode>.env</InlineCode> once (
        <InlineCode>GITHUB_APP_ID</InlineCode>, <InlineCode>GITHUB_APP_PRIVATE_KEY</InlineCode>,{" "}
        <InlineCode>GITHUB_WEBHOOK_SECRET</InlineCode>, <InlineCode>PUBLIC_URL</InlineCode>,{" "}
        <InlineCode>GITHUB_STATE_SECRET</InlineCode>), restart the engine, then open{" "}
        <InlineCode>Integrations → Connect GitHub</InlineCode>. You install the official VersionGate
        App — you do not create your own App. Create a project, pick a repository and branch, and
        push to auto-deploy.
      </P>

      <Callout title="Shared App credentials">
        After the setup wizard finishes, add the official App env vars (same for every self-hosted
        instance) and a public <InlineCode>PUBLIC_URL</InlineCode> (HTTPS). Projects, environments,
        secrets, and HTTPS are then managed from the dashboard.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/architecture", label: "Architecture" }}
        secondary={{ href: "/docs/api-reference", label: "API Reference" }}
      />
    </article>
  );
}
