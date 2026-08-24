import Link from "next/link";
import type { ReactNode } from "react";
import type { Profile } from "@rndm/contracts";
import { Logo } from "../Logo";
import { routes } from "@/lib/routes";

/**
 * Authenticated RNDM application shell.
 *
 * Shares the marketing visual identity (ink background, noise overlay, Zodiak
 * display, Plus Jakarta Sans body) but with application navigation instead of
 * marketing navigation: logo, role badge and sign-out. The marketing site is
 * untouched; this shell only wraps authenticated `/app` surfaces.
 */
export function AppShell({
  profile,
  email,
  children,
}: {
  profile: Profile;
  email: string | null;
  children: ReactNode;
}) {
  const roleLabel =
    profile.role === null
      ? "Onboarding"
      : profile.role === "caller"
        ? "Caller"
        : "Host";

  return (
    <div className="min-h-screen bg-ink selection:bg-accent selection:text-white flex flex-col">
      <div className="noise-overlay" aria-hidden="true" />
      <header className="border-b border-white/5 bg-ink/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-4 flex items-center justify-between gap-4">
          <Link href={routes.app} aria-label="RNDM app home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline text-xs uppercase tracking-[0.2em] text-gray-500 truncate max-w-[180px]">
              {email}
            </span>
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {roleLabel}
            </span>
            <form action={routes.logout} method="post">
              <button
                type="submit"
                className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
