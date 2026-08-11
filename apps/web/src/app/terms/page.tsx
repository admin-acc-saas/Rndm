import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "RNDM terms of service. This is a placeholder pending legal review before production launch.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="These terms are a placeholder. They will be finalized with legal review before RNDM launches to production."
      />

      <Section>
        <div className="prose prose-invert max-w-none text-gray-400 space-y-6">
          <p className="text-sm text-gray-600 font-mono uppercase tracking-widest">
            Status: Draft — not final
          </p>
          <p>
            The final terms of service will describe the rules for using RNDM,
            the coin economy, host obligations, acceptable use, account
            suspension, and applicable limitations.
          </p>
          <p>
            Until the production terms are published, this page should not be
            treated as a binding statement of RNDM&apos;s terms.
          </p>
        </div>
      </Section>
    </MarketingShell>
  );
}
