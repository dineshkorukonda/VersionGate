import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function QuickStart() {
  return (
    <article>
      <Breadcrumb page="Quick Start" />
      <PageTitle>Quick Start</PageTitle>
      <Lead>
        Get VersionGate running on a fresh VM (or existing server) in under 3 minutes. Universal setup, zero-config setup mode, and unified host diagnostics.
      </Lead>

      <H2>Option A: Brand New VM (Zero Prerequisites)</H2>
      <P>
        On a clean VPS with nothing installed (no Bun, Docker, or Git), copy and paste this single command:
      </P>
      <Code title="terminal">{`curl -fsSL https://versiongate.tech/install.sh | sudo bash`}</Code>
      <P>
        This universal installer automatically installs <InlineCode>unzip</InlineCode>, <InlineCode>git</InlineCode>, <InlineCode>curl</InlineCode>, <InlineCode>Bun</InlineCode>, and <InlineCode>Docker Engine</InlineCode>, sets up UFW firewall rules for ports 9090, 5173, 80, and 443, and starts VersionGate in Setup Mode.
      </P>

      <H2>Option B: Existing Server (Docker &amp; Node/Bun Installed)</H2>
      <P>
        If you already have Docker and Node/Bun installed on your server:
      </P>
      <Code title="terminal">{`git clone https://github.com/dineshkorukonda/VersionGate.git
cd VersionGate
bun install
bun run agent      # Audit system prerequisites & copy-paste fix commands
bun run dev        # Start engine on port 9090 in Setup Mode`}</Code>

      <H2>Unified Host Agent Diagnostics</H2>
      <P>
        Run <InlineCode>bun run agent</InlineCode> anytime to audit your host server. If missing dependencies or blocked firewall ports are detected, it prints exact copy-paste fix commands. Run <InlineCode>bun run agent --fix</InlineCode> to auto-repair your system automatically.
      </P>
      <Code title="terminal">{`bun run agent
bun run agent --fix`}</Code>

      <H2>Complete In-UI Setup Wizard</H2>
      <P>
        Once started, open your browser at:
      </P>
      <Code title="browser">{`http://<your-vm-ip>:9090/setup`}</Code>
      <P>
        Enter your PostgreSQL connection string, JWT secrets, and domain. The Setup Wizard tests your database connection, applies Drizzle ORM migrations, writes <InlineCode>.env</InlineCode>, creates your administrator account, and launches the full dashboard.
      </P>

      <Callout title="Setup Mode (Zero Crash-Looping)">
        VersionGate binds to port 9090 immediately without requiring PostgreSQL pre-configuration. You never get locked out of the setup wizard due to database connection errors.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/architecture", label: "Architecture" }}
        secondary={{ href: "/docs/deployment", label: "Deployment & Promotion" }}
      />
    </article>
  );
}
