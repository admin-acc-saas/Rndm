import { MarketingShell } from "@/components/MarketingShell";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Experience } from "@/components/Experience";
import { CallToAction } from "@/components/CallToAction";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({ path: "/" });

export default function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <Features />
      <Experience />
      <CallToAction />
    </MarketingShell>
  );
}
