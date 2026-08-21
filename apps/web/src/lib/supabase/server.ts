import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig, isSupabaseConfigured } from "./client";

/**
 * Server Supabase client for App Router Server Components and Route Handlers.
 * Reads the auth session from cookies using the @supabase/ssr cookie helpers.
 *
 * Returns `null` when Supabase env vars are not configured.
 */
export async function createServerClientFromCookies() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore: the session refresh is handled by middleware or
          // a Client Component where setAll is permitted.
        }
      },
    },
  });
}
