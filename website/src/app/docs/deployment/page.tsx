import { Breadcrumb, Callout, Code, H2, InlineCode, Lead, NextLinks, P, PageTitle } from "../ui";

export default function Deployment() {
  return (
    <article>
      <Breadcrumb page="Deployment" />
      <PageTitle>Deployment &amp; Promotion</PageTitle>
      <Lead>
        Deploys can be triggered three ways: a GitHub push (webhook auto-deploy), the dashboard
        Deploy button, or the REST API. Builds promote across environments without rebuilding.
      </Lead>

      <H2>Webhook auto-deploy</H2>
      <P>
        With the GitHub App installed, pushes to a project&apos;s configured branch are verified via{" "}
        <InlineCode>X-Hub-Signature-256</InlineCode> and enqueued as deploy jobs automatically.
        Pushes to other branches are ignored.
      </P>

      <H2>Manual deploy via API</H2>
      <Code title="terminal">{`# Create a project
curl -X POST http://localhost:9090/api/v1/projects \\
  -H 'Content-Type: application/json' \\
  -d '{ "name": "myapp", "repoUrl": "https://github.com/you/myapp", "branch": "main", "appPort": 3000 }'

# Trigger a deploy
curl -X POST http://localhost:9090/api/v1/deploy \\
  -H 'Content-Type: application/json' \\
  -d '{ "projectId": "<id>" }'`}</Code>

      <H2>Promote without rebuilding</H2>
      <P>
        Promotion reuses the Docker image tag from the source environment&apos;s active deployment —
        the exact artifact verified in staging is what production runs. The build and git-pull steps
        are skipped entirely; only container start, health check, and traffic switch execute.
      </P>
      <Code title="terminal">{`POST /api/v1/projects/:id/environments/:envId/promote
{ "sourceEnvironmentId": "<staging-env-id>" }`}</Code>
      <P>
        The dashboard&apos;s project page renders the environment chain with a Promote button per
        stage, disabled until the upstream environment has an active deployment.
      </P>

      <H2>Rollback</H2>
      <Code title="terminal">{`POST /api/v1/projects/:id/rollback`}</Code>
      <P>
        Rollback restarts the previous <InlineCode>ROLLED_BACK</InlineCode> deployment&apos;s image
        on its original port, health-checks it, then switches Nginx back. If the health check
        fails, the current deployment stays live — rollback never makes things worse.
      </P>

      <Callout title="AI CI pipeline generation">
        With a Gemini API key configured, <InlineCode>POST /api/v1/projects/:id/generate-pipeline</InlineCode>{" "}
        produces a ready-to-commit GitHub Actions workflow for the project.
      </Callout>

      <NextLinks
        primary={{ href: "/docs/networking", label: "Networking" }}
        secondary={{ href: "/docs/api-reference", label: "API Reference" }}
      />
    </article>
  );
}
