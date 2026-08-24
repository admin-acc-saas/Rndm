import type {
  AvailabilityResponse,
  HostApplication,
  OnboardingStateResponse,
} from "@rndm/contracts";
import { AvailabilityControl } from "./AvailabilityControl";
import { HostRateForm } from "./HostRateForm";
import { HostReapply } from "./HostReapply";

/**
 * Authenticated Host home.
 *
 * Renders the application lifecycle state: pending review, approved (with
 * availability control and self-managed calling rate) or rejected (with the
 * recorded reason and the option to apply again). All status comes from the
 * backend; the UI never infers eligibility itself.
 */
export function HostHome({
  state,
  availability,
}: {
  state: OnboardingStateResponse;
  availability: AvailabilityResponse | null;
}) {
  const application = state.hostApplication;

  return (
    <section className="container mx-auto px-6 md:px-8 lg:px-12 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 text-center">
          Host account
        </p>
        <h1 className="text-[clamp(2.25rem,7vw,3.5rem)] font-serif mb-10 leading-tight text-center">
          Welcome,{" "}
          <span className="italic text-accent">
            {state.profile.displayName || "Host"}
          </span>
        </h1>
        <HostStatus application={application} />
        <div className="mt-8 space-y-8">
          {application?.status === "approved" && (
            <>
              {availability && <AvailabilityControl initial={availability} />}
              <HostRateForm
                currentRate={state.hostProfile?.ratePerMinute ?? null}
                min={state.rateBounds.min}
                max={state.rateBounds.max}
              />
            </>
          )}
          {application?.status === "rejected" && <HostReapply />}
        </div>
      </div>
    </section>
  );
}

function HostStatus({ application }: { application: HostApplication | null }) {
  if (!application) {
    return (
      <StatusCard
        label="No application"
        tone="muted"
        title="No Host application yet"
        body="Submit a Host application to start the review process."
      />
    );
  }
  if (application.status === "pending") {
    return (
      <StatusCard
        label="Application pending"
        tone="pending"
        title="Your application is under review"
        body="The RNDM team is reviewing your application. You will be able to set your rate and go online once it is approved."
      />
    );
  }
  if (application.status === "approved") {
    return (
      <StatusCard
        label="Application approved"
        tone="approved"
        title="You are an approved Host"
        body="Your application has been approved. Set your calling rate and go online to become eligible for matching."
      />
    );
  }
  return (
    <StatusCard
      label="Application rejected"
      tone="rejected"
      title="Your application was not approved"
      body={
        application.rejectionReason
          ? `Reason: ${application.rejectionReason}`
          : "Your application was not approved. You may apply again below."
      }
    />
  );
}

function StatusCard({
  label,
  tone,
  title,
  body,
}: {
  label: string;
  tone: "pending" | "approved" | "rejected" | "muted";
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "approved"
      ? "border-green-500/30 text-green-400"
      : tone === "rejected"
        ? "border-red-500/30 text-red-400"
        : tone === "pending"
          ? "border-accent/30 text-accent"
          : "border-white/10 text-gray-500";
  return (
    <div className="rounded-4xl border border-white/10 bg-ink-card p-8 text-center">
      <span
        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 ${toneClass}`}
      >
        {label}
      </span>
      <h2 className="font-serif text-2xl mb-3">{title}</h2>
      <p className="text-sm text-gray-400 font-light leading-relaxed">{body}</p>
    </div>
  );
}
