/**
 * RNDM shared API/domain contracts.
 *
 * These types are the single source of truth for cross-client contracts. The
 * NestJS backend and the Next.js web client import from here so DTO shapes and
 * enums cannot silently drift.
 */

/** The two product roles. Chosen at onboarding; not freely switchable. */
export enum UserRole {
  Caller = "caller",
  Host = "host",
}

/** Account lifecycle status, enforced server-side. */
export enum AccountStatus {
  Active = "active",
  Suspended = "suspended",
  Disabled = "disabled",
}

/**
 * Application profile associated with a Supabase Auth user. Authentication
 * identity remains in Supabase Auth; this record holds the application-level
 * profile, role and account status.
 */
export interface Profile {
  id: string;
  supabaseUserId: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/** Response shape of `GET /auth/me`. */
export interface AuthMeResponse {
  supabaseUserId: string;
  email: string | null;
  profile: Profile | null;
}

/** Response shape of `GET /health`. */
export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  dependencies: {
    database: "ok" | "unconfigured" | "unavailable";
  };
}
