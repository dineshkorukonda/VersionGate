import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { EcosystemStrip } from "@/components/landing/ecosystem-strip";
import { BentoFeatures } from "@/components/landing/bento-features";
import { PipelineShowcase } from "@/components/landing/pipeline-showcase";
import { PaasComparison } from "@/components/landing/paas-comparison";
import { InstallSection } from "@/components/landing/install-section";
import { LandingFAQ } from "@/components/landing-faq";
import { CapabilityGrid } from "@/components/capability-grid";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <EcosystemStrip />
        <BentoFeatures />
        <PipelineShowcase />
        
        {/* Interactive Capability Explorer */}
        <section className="py-20 border-t border-border/40 bg-zinc-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                [ FULL CAPABILITY CATALOG ]
              </p>
              <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Explore Engine Endpoints &amp; Scripts
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Filter through VersionGate's core deployment, networking, security, and monitoring primitives.
              </p>
            </div>
            <CapabilityGrid />
          </div>
        </section>

        <PaasComparison />
        <InstallSection />
        <LandingFAQ />
      </main>
      <SiteFooter />
    </div>
  );
}
