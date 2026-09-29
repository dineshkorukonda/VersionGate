import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FaqSection } from "@/components/landing/faq-section";
import { InstallSection } from "@/components/landing/install-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 antialiased selection:bg-neutral-950 selection:text-white">
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <FeatureShowcase />
        <HowItWorks />
        <FaqSection />
        <InstallSection />
      </main>
      <SiteFooter />
    </div>
  );
}
