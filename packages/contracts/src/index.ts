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

/** Host application review status. Pending applications are not eligible. */
export enum HostApplicationStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

/**
 * Host availability states. Only `offline` and `available` are implemented in
 * Phase 3; `ringing` and `in_call` are reserved for the future call
 * architecture (OFFLINE → AVAILABLE → RINGING → IN_CALL → AVAILABLE) and must
 * never be set by a client.
 */
export enum AvailabilityStatus {
  Offline = "offline",
  Available = "available",
  Ringing = "ringing",
  InCall = "in_call",
}

/** Legal/policy documents a user must accept during onboarding. */
export enum LegalDocumentType {
  Terms = "terms",
  Privacy = "privacy",
  CommunitySafety = "community_safety",
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
  /**
   * The fixed product role. `null` until the user completes role selection
   * during onboarding; immutable afterwards (enforced server-side).
   */
  role: UserRole | null;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/** Caller-specific profile data, collected during Caller onboarding. */
export interface CallerProfile {
  id: string;
  profileId: string;
  dateOfBirth: string | null;
  gender: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Host-specific profile data, collected during Host onboarding. */
export interface HostProfile {
  id: string;
  profileId: string;
  bio: string | null;
  languages: string[];
  /** Host's own calling rate in coins per minute, within platform bounds. */
  ratePerMinute: number | null;
  profileCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A Host application. A profile may have at most one active (pending or
 * approved) application; a rejected application may be re-submitted.
 */
export interface HostApplication {
  id: string;
  profileId: string;
  status: HostApplicationStatus;
  dateOfBirth: string;
  languages: string[];
  bio: string;
  payoutDetails: Record<string, unknown>;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByProfileId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** An immutable audit record of a Host application state transition. */
export interface HostApplicationEvent {
  id: string;
  applicationId: string;
  fromStatus: HostApplicationStatus | null;
  toStatus: HostApplicationStatus;
  actorProfileId: string | null;
  note: string | null;
  createdAt: string;
}

/** A recorded legal/policy acceptance. */
export interface LegalAcceptance {
  id: string;
  profileId: string;
  documentType: LegalDocumentType;
  version: string;
  acceptedAt: string;
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
    redis: "ok" | "unconfigured" | "unavailable";
  };
}

/** Response shape of `GET /onboarding/state`. */
export interface OnboardingStateResponse {
  profile: Profile;
  /** True when the user has not yet selected a fixed Caller/Host role. */
  needsRoleSelection: boolean;
  callerProfile: CallerProfile | null;
  hostProfile: HostProfile | null;
  hostApplication: HostApplication | null;
  /** True when the required onboarding steps for the fixed role are done. */
  onboardingComplete: boolean;
  /** Platform-configured Host calling-rate bounds (coins per minute). */
  rateBounds: RateBoundsConfig;
}

/** Platform-configured bounds for a Host's self-set calling rate. */
export interface RateBoundsConfig {
  min: number;
  max: number;
}

/** Request shape of `POST /onboarding/caller`. */
export interface CompleteCallerOnboardingRequest {
  displayName: string;
  dateOfBirth?: string;
  gender?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCommunitySafety: boolean;
}

/** Request shape of `POST /onboarding/host`. */
export interface SubmitHostOnboardingRequest {
  displayName: string;
  dateOfBirth: string;
  languages: string[];
  bio: string;
  payoutDetails: Record<string, unknown>;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCommunitySafety: boolean;
}

/** Request shape of `PATCH /profiles/me`. */
export interface UpdateProfileRequest {
  displayName?: string;
}

/** Request shape of `PATCH /profiles/me/host`. */
export interface UpdateHostProfileRequest {
  bio?: string;
  languages?: string[];
  ratePerMinute?: number;
}

/** Response shape of `GET /profiles/me`. */
export interface MyProfileResponse {
  profile: Profile;
  callerProfile: CallerProfile | null;
  hostProfile: HostProfile | null;
  hostApplication: HostApplication | null;
  legalAcceptances: LegalAcceptance[];
}

/** Server-side eligibility evaluation for a Host. */
export interface HostEligibilityResult {
  eligible: boolean;
  checks: {
    authenticated: boolean;
    roleIsHost: boolean;
    accountActive: boolean;
    applicationApproved: boolean;
    hostProfileComplete: boolean;
  };
  /** Human-readable reasons the Host is not eligible (empty when eligible). */
  reasons: string[];
}

/** Response shape of `GET /availability/me` and availability mutations. */
export interface AvailabilityResponse {
  status: AvailabilityStatus;
  /** Whether the availability store (Redis) is operational. */
  infrastructure: "ok" | "unconfigured";
  eligibility: HostEligibilityResult;
}

/** Request shape of `POST /admin/host-applications/:id/reject`. */
export interface RejectHostApplicationRequest {
  reason: string;
}

/** Response shape of `GET /admin/host-applications`. */
export interface AdminHostApplicationsResponse {
  applications: HostApplication[];
}
