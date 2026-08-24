import type { OnboardingStateResponse } from "@rndm/contracts";

/**
 * Authenticated Caller home.
 *
 * Matching, discovery and calling arrive in later phases; this screen is the
 * honest authenticated state: the Caller account is active and connected to
 * the production backend.
 */
export function CallerHome({ state }: { state: OnboardingStateResponse }) {
  return (
    <section className="container mx-auto px-6 md:px-8 lg:px-12 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">
          Caller account active
        </p>
        <h1 className="text-[clamp(2.25rem,7vw,3.5rem)] font-serif mb-6 leading-tight">
          Welcome,{" "}
          <span className="italic text-accent">
            {state.profile.displayName || "Caller"}
          </span>
        </h1>
        <p className="text-lg text-gray-400 font-light leading-relaxed mb-10">
          Your account is ready. Host discovery, matching and voice calls are
          being connected next — this is the same production backend your
          account will use.
        </p>
        <div className="rounded-4xl border border-white/10 bg-ink-card p-8 text-left">
          <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-4">
            Your profile
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Display name</dt>
              <dd className="text-white">{state.profile.displayName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Role</dt>
              <dd className="text-white capitalize">{state.profile.role}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Account status</dt>
              <dd className="text-white capitalize">
                {state.profile.accountStatus}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
