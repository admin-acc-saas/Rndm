import type { NextRequest } from "next/server";

/**
 * Public origin of the current request.
 *
 * Behind a reverse proxy that rewrites the Host header (e.g. forwarded dev
 * runtimes, some CDNs) `request.url` carries the internal origin. Prefer the
 * standard forwarded headers so absolute redirects (auth callback, logout)
 * target the externally reachable URL, falling back to the request origin
 * when no proxy headers are present.
 */
export function publicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
