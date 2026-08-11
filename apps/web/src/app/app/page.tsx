import Link from "next/link";
import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { Reveal } from "@/components/Reveal";
import { pageMetadata } from "@/lib/site";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "RNDM App",
    description:
      "The RNDM web application is in development. The authenticated caller and host experiences will be available here.",
    path: "/app",
  }),
  // Do not index the not-yet-real app surface until the real app ships.
  robots: { index: false, follow: false },
};

export default function AppEntryPage() {
  return (
    <MarketingShell>
      <section className="min-h-[80vh] flex items-center justify-center pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <Reveal className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">
              The RNDM app is{" "}
              <span className="italic text-accent">on its way.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 font-light leading-relaxed">
              The authenticated caller and host experiences are being built.
              They will live here, on the same platform and design system as
              this site, connected to the same production backend.
            </p>
            <Link
              href={routes.howItWorks}
              className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.2em]"
            >
              See how it works
            </Link>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
