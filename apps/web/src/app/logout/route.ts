import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig, isSupabaseConfigured } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";

/**
 * Sign-out route. Clears the Supabase session and redirects home. When
 * Supabase is not configured, simply redirects home.
 */
export async function POST(request: NextRequest) {
  const redirectUrl = new URL(routes.home, request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (!isSupabaseConfigured()) {
    return response;
  }

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

  await supabase.auth.signOut();
  return response;
}
