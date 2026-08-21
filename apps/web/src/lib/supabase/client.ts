import { createBrowserClient } from "@supabase/ssr";

/**
 * Public Supabase configuration read from environment.
 *
 * Only the anon/public key is used on the client — the service-role key is
 * never present in frontend code or shipped to the browser.
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function isSupabaseConfigured(): boolean {
  return supabaseConfig.url.length > 0 && supabaseConfig.anonKey.length > 0;
}

/**
 * Browser Supabase client (anon key, respects RLS). Use inside Client
 * Components for auth and public data access.
 *
 * Returns `null` when Supabase env vars are not configured so the UI can
 * render an honest "not yet connected" state instead of crashing.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
