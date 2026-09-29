import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CapabilityGrid } from "@/components/capability-grid";
import { FaqSection } from "@/components/landing/faq-section";
import { InstallSection } from "@/components/landing/install-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <FeatureShowcase />
        <HowItWorks />
        <CapabilityGrid />
        <FaqSection />
        <InstallSection />
      </main>
      <SiteFooter />
    </div>
  );
}
