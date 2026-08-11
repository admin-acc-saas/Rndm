import { MarketingShell } from "@/components/MarketingShell";
import { PageHeader } from "@/components/PageHeader";
import { Section, FeatureRow } from "@/components/Section";
import { CallToAction } from "@/components/CallToAction";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Become a Host",
  description:
    "Hosts set their own calling rate, control availability, and earn from billable call time. Hosting requires an application and review before becoming eligible.",
  path: "/hosts",
});

export default function HostsPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="For Hosts"
        title={
          <>
            Host the{" "}
            <span className="italic text-accent">moment.</span>
          </>
        }
        description="Hosts are a dedicated role on RNDM. Set your own calling rate, control when you are available, and earn from billable call time."
      />

      <Section>
        <FeatureRow title="A dedicated role">
          Hosts onboard through a separate application path. A caller cannot
          switch into a host role, and hosts cannot switch into a caller role.
        </FeatureRow>
        <FeatureRow title="Application & review">
          Host applications require verification and review before a host
          becomes eligible to receive calls. Approval is enforced server-side.
        </FeatureRow>
        <FeatureRow title="Set your own rate">
          Hosts choose their own calling rate, within platform-configured
          minimum and maximum bounds. The platform does not set an individual
          host&apos;s rate.
        </FeatureRow>
        <FeatureRow title="Control availability">
          Go available or offline with one tap. When available, you may be
          matched with callers. When offline, you will not be matched.
        </FeatureRow>
        <FeatureRow title="Earn from billable time">
          Earnings are calculated from finalized call settlements and tracked
          independently from call state. Payout eligibility depends on
          verification and payout requirements.
        </FeatureRow>
      </Section>

      <CallToAction />
    </MarketingShell>
  );
}
