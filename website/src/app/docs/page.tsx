import {
  Breadcrumb,
  Callout,
  CardGrid,
  Code,
  H2,
  InlineCode,
  Lead,
  NextLinks,
  P,
  PageTitle,
  StepCard,
} from "./ui";

const DOCKERFILE = `# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build and start
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`;

const ON_THIS_PAGE = [
  { id: "core-concept", label: "Core Concept" },
  { id: "environment-chain", label: "Environment Chain" },
  { id: "sample-setup", label: "Sample Setup" },
  { id: "health-checks", label: "Health Checks" },
] as const;

export default function DocsIntroduction() {
  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <Breadcrumb page="Introduction" />
        <PageTitle>What is VersionGate?</PageTitle>
        <Lead>
          VersionGate is a self-hosted deployment platform that bridges the gap between your source
          code and production-ready traffic. It automates the lifecycle of your applications using
          a robust blue-green deployment pipeline — on your own server.
        </Lead>

        <div id="core-concept" className="scroll-mt-24">
          <CardGrid>
            <StepCard step="01" title="Git Integration">
              Connect the GitHub App or a webhook — builds trigger the moment you push to your
              repository&apos;s configured branch.
            </StepCard>
            <StepCard step="02" title="Docker Build">
              Applications are containerized from the repo&apos;s Dockerfile with a versioned image
              tag for every deploy.
            </StepCard>
            <StepCard step="03" title="Blue/Green Slots">
              Deploys target the idle slot while the live environment remains untouched until
              health checks pass.
            </StepCard>
          </CardGrid>
        </div>

        <H2 id="environment-chain">The Environment Chain</H2>
        <P>
          Projects can define multiple environments — each with its own branch, port range, and
          deployment history. Builds are promoted downstream without rebuilding, so the exact image
          verified in staging is what reaches production.
        </P>
        <div className="my-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            {[
              { name: "Development", active: false },
              { name: "Staging", active: false },
              { name: "Production", active: true },
            ].map((env, i) => (
              <div key={env.name} className="flex items-center gap-4 sm:gap-6">
                <div
                  className={`flex flex-col items-center gap-2 rounded-2xl px-8 py-6 ${
                    env.active ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white border border-border"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.7">
                    {i === 0 && <path d="M8 9l-3 3 3 3m8-6 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />}
                    {i === 1 && (
                      <path d="M8 3h8M9 3v5l-4.5 8.5A2.5 2.5 0 0 0 6.7 20h10.6a2.5 2.5 0 0 0 2.2-3.5L15 8V3" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {i === 2 && (
                      <path d="M12 15l-3-3c.5-3 2.5-6.5 7-8 1.5 4.5 0 6.5-1 8l-3 3zm-3-3-4 1.5L7.5 16m1.5 3.5L10.5 17M6 18l-2 2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                  <span className={`text-sm font-semibold ${env.active ? "" : "text-foreground"}`}>{env.name}</span>
                </div>
                {i < 2 && (
                  <svg viewBox="0 0 24 24" fill="none" className="hidden size-5 text-muted-foreground sm:block" stroke="currentColor" strokeWidth="1.7">
                    <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <H2 id="sample-setup">Sample Setup</H2>
        <P>
          To get started with VersionGate, ensure your repository contains a standard Dockerfile.
          The engine will detect and build it automatically on every deploy.
        </P>
        <Code title="Dockerfile">{DOCKERFILE}</Code>

        <div id="health-checks" className="scroll-mt-24">
          <Callout title="Traffic Switch & Health Checks">
            Before VersionGate promotes a build to the active slot, it performs mandatory health
            checks against the container&apos;s <InlineCode>healthPath</InlineCode> (default{" "}
            <InlineCode>/health</InlineCode>). Only when the endpoint returns{" "}
            <InlineCode>200 OK</InlineCode> within the latency threshold does Nginx switch traffic
            from the old slot to the new one.
          </Callout>
        </div>

        <NextLinks
          primary={{ href: "/docs/quick-start", label: "Quick Start Guide" }}
          secondary={{ href: "/docs/architecture", label: "Architecture Deep Dive" }}
        />
      </article>

      <aside className="hidden w-44 shrink-0 xl:block">
        <div className="sticky top-24">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </div>
          <ul className="space-y-2 border-l border-border pl-4">
            {ON_THIS_PAGE.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-xs text-muted-foreground transition hover:text-primary">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
