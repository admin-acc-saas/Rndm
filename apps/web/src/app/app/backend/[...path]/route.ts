import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl } from "@/lib/api/client";
import { createServerClientFromCookies } from "@/lib/supabase/server";

/**
 * Same-origin proxy to the NestJS backend for browser mutations and reads.
 *
 * Client components in `/app` fetch `/app/backend/<path>`. This route handler
 * attaches the Supabase access token from the session cookie server-side, so
 * tokens are never exposed to client-side JavaScript. Responses (status and
 * JSON body) are passed through unchanged.
 */
async function proxy(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname.replace(/^\/app\/backend\//, "/");
  const supabase = await createServerClientFromCookies();
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session) {
    return NextResponse.json(
      { statusCode: 401, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await res.arrayBuffer();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
