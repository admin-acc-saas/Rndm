import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig, isSupabaseConfigured } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";

/**
 * Supabase auth callback (magic-link / OAuth redirect target).
 *
 * Exchanges the `code` query param for a session, then redirects to the app
 * entry point. When Supabase is not configured, redirects to the app page
 * (which renders an honest "not configured" state).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL(routes.app, requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL(routes.app, requestUrl.origin));
  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
