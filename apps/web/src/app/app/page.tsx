import Link from "next/link";
import { redirect } from "next/navigation";
import type {
  AuthMeResponse,
  AvailabilityResponse,
  OnboardingStateResponse,
} from "@rndm/contracts";
import { UserRole } from "@rndm/contracts";
import {
  getAuthMe,
  getAvailability,
  getOnboardingState,
  isApiConfigured,
} from "@/lib/api/client";
import { createServerClientFromCookies } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { Logo } from "@/components/Logo";
import { AppShell } from "@/components/app/AppShell";
import { OnboardingFlow } from "@/components/app/OnboardingFlow";
import { CallerHome } from "@/components/app/CallerHome";
import { HostHome } from "@/components/app/HostHome";

export const metadata = {
  title: "App | RNDM",
  robots: { index: false, follow: false },
};

/**
 * Authenticated RNDM app home.
 *
 * When Supabase Auth and the backend API are configured, this renders the
 * real authenticated experience: role selection for new users, the Caller
 * home, or the Host home with the application/review lifecycle and
 * eligibility-gated availability. All role/status data is read server-side
 * from the backend — never from the browser.
 *
 * When auth infrastructure is not configured the page still reports state
 * honestly (fail-closed), it does not render a fake authenticated shell.
 */
export default async function AppPage() {
  const supabase = await createServerClientFromCookies();

  if (!supabase || !isApiConfigured()) {
    return <AppUnavailable />;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect(routes.login);
  }

  let authMe: AuthMeResponse;
  try {
    authMe = await getAuthMe(session.access_token);
  } catch {
    return <BackendUnavailable />;
  }

  const state: OnboardingStateResponse = await getOnboardingState(
    session.access_token,
  );

  if (state.needsRoleSelection) {
    return (
      <AppShell profile={state.profile} email={authMe.email}>
        <section className="container mx-auto px-6 md:px-8 lg:px-12 py-16 md:py-24">
          <OnboardingFlow />
        </section>
      </AppShell>
    );
  }

  if (state.profile.role === UserRole.Host) {
    // Availability is Host-only; a 403/500 here must never break the page.
    let availability: AvailabilityResponse | null = null;
    if (state.hostApplication?.status === "approved") {
      availability = await getAvailability(session.access_token).catch(
        () => null,
      );
    }
    return (
      <AppShell profile={state.profile} email={authMe.email}>
        <HostHome state={state} availability={availability} />
      </AppShell>
    );
  }

  return (
    <AppShell profile={state.profile} email={authMe.email}>
      <CallerHome state={state} />
    </AppShell>
  );
}

function AppUnavailable() {
  return (
    <div className="min-h-screen bg-ink selection:bg-accent selection:text-white flex items-center justify-center">
      <div className="noise-overlay" aria-hidden="true" />
      <section className="container mx-auto px-6 md:px-8 lg:px-12 text-center max-w-xl">
        <Logo className="mx-auto mb-10" />
        <h1 className="text-[clamp(2.25rem,7vw,3.5rem)] font-serif mb-6 leading-tight">
          The RNDM app is <span className="italic text-accent">almost here</span>
        </h1>
        <p className="text-lg text-gray-400 font-light leading-relaxed mb-10">
          Authentication is not configured in this environment yet. Once
          Supabase Auth and the backend are connected, this page becomes the
          real authenticated RNDM experience — onboarding, Caller home and
          Host home.
        </p>
        <Link
          href={routes.home}
          className="inline-flex items-center justify-center px-8 py-4 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.12em] sm:tracking-[0.2em]"
        >
          Back to home
        </Link>
      </section>
    </div>
  );
}

function BackendUnavailable() {
  return (
    <div className="min-h-screen bg-ink selection:bg-accent selection:text-white flex items-center justify-center">
      <div className="noise-overlay" aria-hidden="true" />
      <section className="container mx-auto px-6 md:px-8 lg:px-12 text-center max-w-xl">
        <Logo className="mx-auto mb-10" />
        <h1 className="text-[clamp(2.25rem,7vw,3.5rem)] font-serif mb-6 leading-tight">
          We&apos;ll be right <span className="italic text-accent">back</span>
        </h1>
        <p className="text-lg text-gray-400 font-light leading-relaxed mb-10">
          You are signed in, but the RNDM backend could not be reached. This is
          a temporary state — nothing about your account has changed. Please
          try again in a moment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={routes.app}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.12em] sm:tracking-[0.2em]"
          >
            Try again
          </Link>
          <form action={routes.logout} method="post">
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
