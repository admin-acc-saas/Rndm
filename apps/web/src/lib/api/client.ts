import type { AuthMeResponse, HealthResponse } from "@rndm/contracts";

/**
 * Backend API base URL (the NestJS API). Configured via
 * `NEXT_PUBLIC_API_URL`; defaults to the local backend.
 */
export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function isApiConfigured(): boolean {
  return apiBaseUrl.length > 0;
}

async function request<T>(
  path: string,
  accessToken?: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message ?? res.statusText)
      .catch(() => res.statusText);
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Unauthenticated health probe. */
export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

/**
 * Authenticated `/auth/me`. Requires a Supabase access token. Returns the
 * Supabase identity and the application profile.
 */
export function getAuthMe(accessToken: string): Promise<AuthMeResponse> {
  return request<AuthMeResponse>("/auth/me", accessToken);
}
