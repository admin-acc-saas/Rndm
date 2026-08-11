import Link from "next/link";
import { routes } from "@/lib/routes";
import { createServerClientFromCookies } from "@/lib/supabase/server";
import { getAuthMe } from "@/lib/api/client";

/**
 * Auth boundary for the RNDM app entry.
 *
 * Server Component that reads the Supabase session from cookies. When
 * authenticated, it calls the backend `/auth/me` to display the resolved
 * profile. When unauthenticated, it renders a sign-in CTA.
 *
 * The profile here is presentation-only for Phase 2; the real caller/host
 * experiences are a later phase.
 */
export async function AppGateway() {
  const supabase = await createServerClientFromCookies();
  if (!supabase) {
    return <NotConfigured />;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <Unauthenticated />;
  }

  // Authenticated: ask the backend who this user is in the RNDM application
  // domain. Failures degrade gracefully — we never expose internal errors.
  try {
    const me = await getAuthMe(session.access_token);
    return <Authenticated email={me.email} role={me.profile?.role ?? null} />;
  } catch {
    return <Unauthenticated />;
  }
}

function Authenticated({
  email,
  role,
}: {
  email: string | null;
  role: string | null;
}) {
  return (
    <div className="max-w-xl mx-auto text-center">
      <h1 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
        You&apos;re signed in to <span className="italic text-accent">RNDM</span>
      </h1>
      <p className="text-lg text-gray-400 font-light leading-relaxed mb-8">
        {email ? `Signed in as ${email}.` : "Signed in."}{" "}
        {role ? `Account role: ${role}.` : "Your account role is not yet set."}
      </p>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
        The caller and host experiences are the next phase of the build. Your
        session is valid and connected to the production backend.
      </p>
      <form action={routes.logout} method="post" className="inline-block">
        <button
          type="submit"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all uppercase tracking-[0.2em]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Unauthenticated() {
  return (
    <div className="max-w-xl mx-auto text-center">
      <h1 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">
        The RNDM app is{" "}
        <span className="italic text-accent">on its way.</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 font-light leading-relaxed">
        The authenticated caller and host experiences are being built. Sign in
        to access your account as the experience ships.
      </p>
      <Link
        href={routes.login}
        className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.2em]"
      >
        Sign in
      </Link>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="max-w-xl mx-auto text-center">
      <h1 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">
        The RNDM app is{" "}
        <span className="italic text-accent">on its way.</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 font-light leading-relaxed">
        Authentication is not connected in this environment. The authenticated
        caller and host experiences will appear here once the backend is
        connected.
      </p>
      <Link
        href={routes.howItWorks}
        className="inline-flex items-center justify-center px-10 py-4 rounded-full text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.2em]"
      >
        See how it works
      </Link>
    </div>
  );
}
