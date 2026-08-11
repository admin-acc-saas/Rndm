import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";
import { Section, FeatureRow } from "@/components/Section";
import { CallToAction } from "@/components/CallToAction";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Features",
  description:
    "Anonymous 1-on-1 voice calls, verified hosts, language and topic filters, and a host experience with availability controls and analytics.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Features"
        title={
          <>
            Conversations that{" "}
            <span className="italic text-white/60">disappear</span>, moments
            that <span className="italic">linger</span>.
          </>
        }
        description="Privacy is the foundation of honesty. RNDM is built as an anonymous space for late-night thoughts, language practice, and everything in between."
      />

      <Section>
        <FeatureRow title="Anonymous by design">
          Calls are 1-on-1 voice connections. RNDM is designed so callers can
          connect without exposing personal contact details.
        </FeatureRow>
        <FeatureRow title="Verified hosts">
          Hosts are onboarded through a separate application and review process
          before they become eligible to receive calls. Hosts are never
          auto-approved.
        </FeatureRow>
        <FeatureRow title="Language & topic filters">
          Callers can filter by language and topic-based categories to find a
          host who fits the conversation they want to have.
        </FeatureRow>
        <FeatureRow title="Host availability controls">
          Hosts control when they are available to receive calls with one tap,
          and can go offline at any time. Availability is enforced by the
          backend.
        </FeatureRow>
        <FeatureRow title="Server-authoritative billing">
          Coin balances, call duration, rates and earnings are all controlled
          by the backend. The client never decides billing state.
        </FeatureRow>
      </Section>

      <CallToAction />
    </MarketingShell>
  );
}
