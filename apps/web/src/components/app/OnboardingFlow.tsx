"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * One-time role selection + Caller/Host onboarding forms.
 *
 * The role choice is submitted to the backend, which assigns it exactly once
 * and rejects any later change. The forms POST through the same-origin
 * `/app/backend/*` proxy so access tokens never touch client-side JS.
 */

type Step = "choose" | "caller" | "host";
type Status = "idle" | "submitting" | "error";

const inputClass =
  "w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-accent transition-colors";

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`/app/backend${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await res
      .json()
      .then((b) => b?.message ?? res.statusText)
      .catch(() => res.statusText);
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
}

export function OnboardingFlow({ initialStep = "choose" }: { initialStep?: Step }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(path: string, body: unknown) {
    setStatus("submitting");
    setError(null);
    try {
      await post(path, body);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (step === "caller") {
    return <CallerForm status={status} error={error} onSubmit={submit} onBack={() => setStep("choose")} />;
  }
  if (step === "host") {
    return <HostForm status={status} error={error} onSubmit={submit} onBack={() => setStep("choose")} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-[clamp(2rem,6vw,3rem)] font-serif mb-4 leading-tight">
          Choose how you join <span className="italic text-accent">RNDM</span>
        </h1>
        <p className="text-gray-400 font-light">
          This choice is permanent. Caller and Host accounts are separate and
          cannot be switched later.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => setStep("caller")}
          className="text-left rounded-4xl border border-white/10 bg-ink-card p-8 hover:border-accent transition-colors group"
        >
          <h2 className="font-serif text-2xl mb-3 group-hover:text-accent transition-colors">
            I&apos;m a Caller
          </h2>
          <p className="text-sm text-gray-400 font-light leading-relaxed">
            Discover hosts, start voice conversations and pay per minute with
            coins.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStep("host")}
          className="text-left rounded-4xl border border-white/10 bg-ink-card p-8 hover:border-accent transition-colors group"
        >
          <h2 className="font-serif text-2xl mb-3 group-hover:text-accent transition-colors">
            I&apos;m a Host
          </h2>
          <p className="text-sm text-gray-400 font-light leading-relaxed">
            Apply to host, set your own rate and earn from billable call time.
            Applications are reviewed before you can receive calls.
          </p>
        </button>
      </div>
    </div>
  );
}

function LegalCheckboxes({
  values,
  onChange,
}: {
  values: { terms: boolean; privacy: boolean; safety: boolean };
  onChange: (next: { terms: boolean; privacy: boolean; safety: boolean }) => void;
}) {
  const item = (
    key: "terms" | "privacy" | "safety",
    label: React.ReactNode,
  ) => (
    <label className="flex items-start gap-3 text-sm text-gray-300 font-light cursor-pointer">
      <input
        type="checkbox"
        checked={values[key]}
        onChange={(e) => onChange({ ...values, [key]: e.target.checked })}
        className="mt-1 accent-[#FF4500]"
        required
      />
      <span>{label}</span>
    </label>
  );
  return (
    <div className="space-y-3">
      {item(
        "terms",
        <>
          I accept the{" "}
          <a href="/terms" className="underline hover:text-white" target="_blank">
            Terms of Service
          </a>
          .
        </>,
      )}
      {item(
        "privacy",
        <>
          I accept the{" "}
          <a href="/privacy" className="underline hover:text-white" target="_blank">
            Privacy Policy
          </a>
          .
        </>,
      )}
      {item(
        "safety",
        "I agree to the RNDM community and safety guidelines, and I confirm I am of legal adult age in my jurisdiction.",
      )}
    </div>
  );
}

function SubmitButton({ status, label }: { status: Status; label: string }) {
  return (
    <button
      type="submit"
      disabled={status === "submitting"}
      className="w-full inline-flex items-center justify-center px-8 py-4 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.12em] sm:tracking-[0.2em] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {status === "submitting" ? "Submitting…" : label}
    </button>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-red-400">
      {error}
    </p>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
    >
      ← Back
    </button>
  );
}

function CallerForm({
  status,
  error,
  onSubmit,
  onBack,
}: {
  status: Status;
  error: string | null;
  onSubmit: (path: string, body: unknown) => void;
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [legal, setLegal] = useState({ terms: false, privacy: false, safety: false });

  return (
    <form
      className="max-w-xl mx-auto space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit("/onboarding/caller", {
          displayName,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          acceptTerms: legal.terms,
          acceptPrivacy: legal.privacy,
          acceptCommunitySafety: legal.safety,
        });
      }}
    >
      <BackButton onBack={onBack} />
      <h1 className="font-serif text-3xl">
        Caller <span className="italic text-accent">onboarding</span>
      </h1>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Display name</span>
        <input className={inputClass} required maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How hosts will see you" />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Date of birth (optional)</span>
        <input className={inputClass} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Gender (optional)</span>
        <input className={inputClass} maxLength={40} value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Optional" />
      </label>
      <LegalCheckboxes values={legal} onChange={setLegal} />
      <ErrorMessage error={error} />
      <SubmitButton status={status} label="Complete Caller onboarding" />
    </form>
  );
}

function HostForm({
  status,
  error,
  onSubmit,
  onBack,
}: {
  status: Status;
  error: string | null;
  onSubmit: (path: string, body: unknown) => void;
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");
  const [payoutUpi, setPayoutUpi] = useState("");
  const [legal, setLegal] = useState({ terms: false, privacy: false, safety: false });

  return (
    <form
      className="max-w-xl mx-auto space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit("/onboarding/host", {
          displayName,
          dateOfBirth,
          languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
          bio,
          payoutDetails: { method: "upi", upiId: payoutUpi },
          acceptTerms: legal.terms,
          acceptPrivacy: legal.privacy,
          acceptCommunitySafety: legal.safety,
        });
      }}
    >
      <BackButton onBack={onBack} />
      <h1 className="font-serif text-3xl">
        Host <span className="italic text-accent">application</span>
      </h1>
      <p className="text-sm text-gray-400 font-light">
        Your application is reviewed by the RNDM team before you can receive
        calls. You set your own calling rate after approval.
      </p>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Display name</span>
        <input className={inputClass} required maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How callers will see you" />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Date of birth</span>
        <input className={inputClass} required type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Languages (comma separated)</span>
        <input className={inputClass} required value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi" />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Bio (min 20 characters)</span>
        <textarea className={`${inputClass} min-h-28`} required minLength={20} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell callers who you are and what you love to talk about" />
      </label>
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Payout UPI ID</span>
        <input className={inputClass} required value={payoutUpi} onChange={(e) => setPayoutUpi(e.target.value)} placeholder="name@bank" />
      </label>
      <LegalCheckboxes values={legal} onChange={setLegal} />
      <ErrorMessage error={error} />
      <SubmitButton status={status} label="Submit Host application" />
    </form>
  );
}
