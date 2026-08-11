import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";
import { Section, FeatureRow } from "@/components/Section";
import { CallToAction } from "@/components/CallToAction";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "How RNDM works: callers purchase coins, match with an eligible host, and connect on a 1-on-1 voice call. Hosts apply, set their rate, and earn from billable call time.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="How it works"
        title={
          <>
            One tap to a{" "}
            <span className="italic text-accent">real conversation.</span>
          </>
        }
        description="RNDM connects a caller with an eligible host for a 1-on-1 voice call. Matching, eligibility and billing are all controlled by the backend."
      />

      <Section>
        <FeatureRow title="1 · Choose your role">
          RNDM has two roles: Caller and Host. You choose a role during
          onboarding. A caller cannot toggle into a host role, and hosts are
          onboarded through a separate review process.
        </FeatureRow>
        <FeatureRow title="2 · Get coins (callers)">
          Callers use a pay-as-you-go coin balance. Coins are represented as
          durable ledger entries, never direct client arithmetic. Coin packages
          are configured by the platform.
        </FeatureRow>
        <FeatureRow title="3 · Match with a host">
          When you start a match, the backend checks eligibility, reserves the
          host with a short-lived lock, and authorizes the voice session. Two
          callers cannot reserve the same host at once.
        </FeatureRow>
        <FeatureRow title="4 · Talk">
          The voice session is carried over LiveKit. Billing starts only when
          the call reaches its billable state and stops according to
          authoritative termination rules.
        </FeatureRow>
        <FeatureRow title="5 · Settle">
          After the call, the backend settles the transaction idempotently: the
          caller is charged, the host earns, and RNDM retains its configured
          share. Retries never double-charge or double-pay.
        </FeatureRow>
      </Section>

      <CallToAction />
    </MarketingShell>
  );
}
