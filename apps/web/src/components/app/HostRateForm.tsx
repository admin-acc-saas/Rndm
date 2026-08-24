"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Host calling-rate editor.
 *
 * Hosts set their own rate; platform min/max bounds come from backend
 * configuration and are enforced server-side. Admin never sets a Host's rate.
 */
export function HostRateForm({
  currentRate,
  min,
  max,
}: {
  currentRate: number | null;
  min: number;
  max: number;
}) {
  const router = useRouter();
  const [rate, setRate] = useState(currentRate?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/app/backend/profiles/me/host", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ratePerMinute: Number(rate) }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body?.message === "string" ? body.message : "Request failed",
        );
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-4xl border border-white/10 bg-ink-card p-8 space-y-4"
    >
      <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500">
        Your calling rate
      </h2>
      <p className="text-sm text-gray-400 font-light leading-relaxed">
        Set your own rate in coins per minute (platform range {min}–{max}).
      </p>
      <div className="flex gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          required
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-base text-white focus:outline-none focus:border-accent transition-colors"
          placeholder={`${min}–${max}`}
        />
        <button
          type="submit"
          disabled={busy}
          className="px-6 rounded-full text-xs font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.15em] disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-sm text-green-400">
          Rate saved.
        </p>
      )}
    </form>
  );
}
