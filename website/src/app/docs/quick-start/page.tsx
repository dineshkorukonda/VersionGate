import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function QuickStart() {
  return (
    <article>
      <Breadcrumb page="Quick Start" />
      <PageTitle>Quick Start</PageTitle>
      <Lead>
        Get VersionGate running on a fresh Ubuntu/Debian VPS in under 5 minutes. The setup script configures PostgreSQL, Redis, Docker, and Nginx — enabling instant GitHub repository sync and zero-downtime deployments.
      </Lead>

      <H2>1. Clone the repository</H2>
      <Code title="terminal">{`git clone https://github.com/dineshkorukonda/VersionGate.git
cd VersionGate`}</Code>

      <H2>2. Bootstrap the host server (Ubuntu/Debian)</H2>
      <P>
        On a clean VM this installs Docker, adds your user to the <InlineCode>docker</InlineCode> group, creates the <InlineCode>versiongate-net</InlineCode> network, creates <InlineCode>/var/versiongate/projects</InlineCode>, and installs Nginx, Certbot, and PM2.
      </P>
      <Code title="terminal">{`sudo bash scripts/bootstrap-host.sh
newgrp docker          # apply docker group membership
bun run preflight     # validate host requirements`}</Code>
      <Callout title="Already have Docker & Node/Bun?">
        You can skip bootstrap and directly execute <InlineCode>bun run preflight</InlineCode> to validate system prerequisites.
      </Callout>

      <H2>3. Install packages &amp; build the dashboard</H2>
      <Code title="terminal">{`bun install
cd dashboard && bun install && bun run build && cd ..`}</Code>

      <H2>4. Run guided setup wizard</H2>
      <Code title="terminal">{`bun scripts/setup.ts`}</Code>
      <P>
        The interactive setup wizard configures your <InlineCode>DATABASE_URL</InlineCode>, generates encryption keys, sets your <InlineCode>PUBLIC_URL</InlineCode>, and writes your <InlineCode>GITHUB_STATE_SECRET</InlineCode>.
      </P>

      <H2>5. Start VersionGate engine</H2>
      <Code title="terminal">{`# Production
pm2 start ecosystem.config.cjs
pm2 save

# Development
bun --watch src/server.ts`}</Code>

      <H2>6. Connect GitHub &amp; deploy your first app</H2>
      <P>
        Open your VersionGate dashboard at <InlineCode>http://your-server-ip:5173/integrations</InlineCode> (or your custom domain) and follow the 2-click setup:
      </P>
      
      <H2>Option A: VersionGate Central Cloud Relay (Recommended — 0 Config)</H2>
      <P>
        Ensure your <InlineCode>.env</InlineCode> has <InlineCode>PUBLIC_URL=https://your-domain.com</InlineCode> and <InlineCode>GITHUB_STATE_SECRET=your_relay_secret</InlineCode>. In the dashboard, click <InlineCode>Connect with VersionGate Central Relay</InlineCode>, authorize your GitHub repositories, and you&apos;re done!
      </P>

      <H2>Option B: Custom GitHub App (Self-Service)</H2>
      <P>
        If you prefer full ownership of your own GitHub App, set <InlineCode>GITHUB_APP_ID</InlineCode>, <InlineCode>GITHUB_APP_PRIVATE_KEY</InlineCode>, and <InlineCode>GITHUB_WEBHOOK_SECRET</InlineCode> in <InlineCode>.env</InlineCode>, restart the engine, and install the app on your GitHub account.
      </P>

      <Callout title="Automatic Push Webhooks">
        Once connected, VersionGate listens for <InlineCode>push</InlineCode> webhooks on your configured branches, building multi-stage Docker containers and executing zero-downtime Nginx upstream switches automatically on every commit.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/architecture", label: "Architecture" }}
        secondary={{ href: "/docs/deployment", label: "Deployment & Promotion" }}
      />
    </article>
  );
}
