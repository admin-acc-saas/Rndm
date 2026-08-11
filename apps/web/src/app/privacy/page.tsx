import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "RNDM privacy policy. This is a placeholder pending legal review before production launch.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="This privacy policy is a placeholder. It will be finalized with legal review before RNDM launches to production."
      />

      <Section>
        <div className="prose prose-invert max-w-none text-gray-400 space-y-6">
          <p className="text-sm text-gray-600 font-mono uppercase tracking-widest">
            Status: Draft — not final
          </p>
          <p>
            RNDM is a voice-social platform. The final privacy policy will
            describe what data is collected, how it is used, how it is stored
            and retained, and the rights available to users.
          </p>
          <p>
            Until the production privacy policy is published, this page should
            not be treated as a binding statement of RNDM&apos;s privacy practices.
          </p>
        </div>
      </Section>
    </MarketingShell>
  );
}
