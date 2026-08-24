"use client";

import { useState } from "react";
import { OnboardingFlow } from "./OnboardingFlow";

/**
 * Host re-application after rejection.
 *
 * The role stays fixed as Host; this re-opens only the Host application form
 * (the backend keeps the existing role and creates a fresh application).
 */
export function HostReapply() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-4xl border border-white/10 bg-ink-card p-8">
        <OnboardingFlow initialStep="host" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-8 py-4 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.12em] sm:tracking-[0.2em]"
      >
        Apply again
      </button>
    </div>
  );
}
