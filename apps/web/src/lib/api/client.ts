import type {
  AuthMeResponse,
  AvailabilityResponse,
  HealthResponse,
  HostEligibilityResult,
  MyProfileResponse,
  OnboardingStateResponse,
} from "@rndm/contracts";

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

/** Authenticated onboarding state. */
export function getOnboardingState(
  accessToken: string,
): Promise<OnboardingStateResponse> {
  return request<OnboardingStateResponse>("/onboarding/state", accessToken);
}

/** Authenticated full profile view. */
export function getMyProfile(
  accessToken: string,
): Promise<MyProfileResponse> {
  return request<MyProfileResponse>("/profiles/me", accessToken);
}

/** Authenticated availability state (Host). */
export function getAvailability(
  accessToken: string,
): Promise<AvailabilityResponse> {
  return request<AvailabilityResponse>("/availability/me", accessToken);
}

/** Authenticated Host eligibility evaluation. */
export function getEligibility(
  accessToken: string,
): Promise<HostEligibilityResult> {
  return request<HostEligibilityResult>("/eligibility/me", accessToken);
}
