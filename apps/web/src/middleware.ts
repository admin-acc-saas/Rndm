import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Refreshes the Supabase auth session on every request and keeps the auth
 * cookies in sync. This is the @supabase/ssr recommended pattern for App
 * Router.
 *
 * When Supabase is not configured, the middleware is a no-op pass-through so
 * the marketing site still works during local development without a backend.
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() refreshes the session cookies via the setAll callback.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.svg|fonts|og.png|noise.svg|atmosphere|robots.txt|sitemap.xml).*)",
  ],
};
