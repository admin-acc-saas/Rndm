"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setStatus("error");
      setMessage(
        "Authentication is not connected in this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in.",
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-full bg-white/5 border border-white/10 px-6 py-4 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full inline-flex items-center justify-center px-10 py-4 rounded-full text-sm font-semibold bg-white text-black hover:bg-accent hover:text-white transition-all uppercase tracking-[0.2em] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </button>
      </form>

      {message && (
        <p
          role="status"
          className={`mt-6 text-sm ${status === "error" ? "text-red-400" : "text-gray-300"}`}
        >
          {message}
        </p>
      )}

      <p className="mt-8 text-xs text-gray-500 leading-relaxed">
        RNDM uses passwordless email sign-in. After you confirm by email you will
        be redirected to the RNDM app.{" "}
        <a href={routes.app} className="underline hover:text-white">
          Go to the app
        </a>
        .
      </p>
    </div>
  );
}
