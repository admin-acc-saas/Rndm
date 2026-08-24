"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AvailabilityResponse } from "@rndm/contracts";

const HEARTBEAT_MS = 60_000;

/**
 * Host availability control.
 *
 * Talks to the backend through the same-origin proxy. Going online is gated
 * server-side by eligibility; while online, a heartbeat refreshes the Redis
 * TTL so availability never survives a closed browser. RINGING/IN_CALL are
 * backend-owned future states and never appear here.
 */
export function AvailabilityControl({
  initial,
}: {
  initial: AvailabilityResponse;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const online = state.status === "available";

  useEffect(() => {
    if (!online) return;
    const id = setInterval(async () => {
      const res = await fetch("/app/backend/availability/heartbeat", {
        method: "POST",
      });
      if (res.ok) {
        setState(await res.json());
      } else {
        router.refresh();
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [online, router]);

  async function act(path: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/app/backend/availability/${path}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body?.message === "string" ? body.message : "Request failed",
        );
      }
      setState(body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (state.infrastructure === "unconfigured") {
    return (
      <div className="rounded-4xl border border-white/10 bg-ink-card p-8">
        <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-4">
          Availability
        </h2>
        <p className="text-sm text-gray-400 font-light leading-relaxed">
          Availability infrastructure is not connected in this environment, so
          you cannot go online yet. This is reported honestly rather than
          faked.
        </p>
      </div>
    );
  }

  if (!state.eligibility.eligible) {
    return (
      <div className="rounded-4xl border border-white/10 bg-ink-card p-8">
        <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-4">
          Availability
        </h2>
        <p className="text-sm text-gray-400 font-light leading-relaxed mb-4">
          You can go online once every eligibility requirement passes on the
          server:
        </p>
        <ul className="space-y-2 text-sm text-gray-300 font-light list-disc list-inside">
          {state.eligibility.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-4xl border border-white/10 bg-ink-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500">
          Availability
        </h2>
        <span
          className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] ${
            online ? "text-green-400" : "text-gray-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              online ? "bg-green-400 animate-pulse-dot" : "bg-gray-600"
            }`}
          />
          {online ? "Available" : "Offline"}
        </span>
      </div>
      <p className="text-sm text-gray-400 font-light leading-relaxed mb-6">
        {online
          ? "You are online and eligible to be matched. Stay on this page to remain available."
          : "Go online to become eligible for matching. You will remain available while you keep this page open."}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-400 mb-4">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => act(online ? "offline" : "online")}
        className={`w-full inline-flex items-center justify-center px-8 py-4 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] sm:tracking-[0.2em] transition-all disabled:opacity-60 ${
          online
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-white text-black hover:bg-accent hover:text-white"
        }`}
      >
        {busy ? "Working…" : online ? "Go offline" : "Go online"}
      </button>
    </div>
  );
}
