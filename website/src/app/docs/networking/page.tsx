import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function Networking() {
  return (
    <article>
      <Breadcrumb page="Networking" />
      <PageTitle>Networking</PageTitle>
      <Lead>
        VersionGate manages an Nginx upstream file and a dedicated Docker network. Traffic switching
        is a config rewrite plus reload — never a restart.
      </Lead>

      <H2>Ports and slots</H2>
      <P>
        Each environment reserves two host ports: <InlineCode>basePort</InlineCode> (blue) and{" "}
        <InlineCode>basePort + 1</InlineCode> (green). Inside the container your app listens on{" "}
        <InlineCode>appPort</InlineCode>; Docker maps it to the slot&apos;s host port.
      </P>

      <H2>Nginx upstream switching</H2>
      <Code title="/etc/nginx/conf.d/upstream.conf">{`upstream myapp {
    server 127.0.0.1:3101;   # rewritten by VersionGate on every switch
}`}</Code>
      <P>
        After a health-checked deploy, VersionGate rewrites the upstream port and runs{" "}
        <InlineCode>nginx -s reload</InlineCode>. Existing connections drain gracefully; new
        requests hit the new container.
      </P>

      <H2>Docker network</H2>
      <Code title="terminal">{`docker network create versiongate-net`}</Code>
      <P>
        All deployed containers join <InlineCode>versiongate-net</InlineCode> (configurable via{" "}
        <InlineCode>DOCKER_NETWORK</InlineCode>), so services can reach each other by container name.
      </P>

      <H2>Domains &amp; HTTPS</H2>
      <P>
        Settings → Dashboard URL lets you set <InlineCode>PUBLIC_DOMAIN</InlineCode> and provision
        certificates via Certbot. Preflight validates DNS resolution, certbot availability, and{" "}
        <InlineCode>CERTBOT_EMAIL</InlineCode> before attempting issuance.
      </P>

      <H2>Webhook endpoints</H2>
      <P>
        GitHub App webhooks arrive at <InlineCode>{`{PUBLIC_URL}`}/api/webhooks/github</InlineCode>{" "}
        and are verified with <InlineCode>GITHUB_WEBHOOK_SECRET</InlineCode>. Legacy per-project
        webhooks (<InlineCode>/api/v1/webhooks/:secret</InlineCode>) continue to work.
      </P>

      <Callout title="Behind PM2 with a minimal PATH?">
        If Docker is installed but PM2 strips your <InlineCode>PATH</InlineCode>, set{" "}
        <InlineCode>DOCKER_BIN=/usr/bin/docker</InlineCode> in <InlineCode>.env</InlineCode>.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/api-reference", label: "API Reference" }}
        secondary={{ href: "/docs", label: "Back to Introduction" }}
      />
    </article>
  );
}
