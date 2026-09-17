import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { EcosystemStrip } from "@/components/landing/ecosystem-strip";
import { BentoFeatures } from "@/components/landing/bento-features";
import { PipelineShowcase } from "@/components/landing/pipeline-showcase";
import { PaasComparison } from "@/components/landing/paas-comparison";
import { InstallSection } from "@/components/landing/install-section";
import { LandingFAQ } from "@/components/landing-faq";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <EcosystemStrip />
        <BentoFeatures />
        <PipelineShowcase />
        <PaasComparison />
        <InstallSection />
        <LandingFAQ />
      </main>
      <SiteFooter />
    </div>
  );
}
