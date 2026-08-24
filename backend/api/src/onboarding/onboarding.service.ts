import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CompleteCallerOnboardingRequest,
  HostApplicationStatus,
  OnboardingStateResponse,
  Profile,
  SubmitHostOnboardingRequest,
  UserRole,
} from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { AppConfigService } from "../config/app-config.service";
import { UsersService } from "../users/users.service";
import { ProfilesService } from "../profiles/profiles.service";
import {
  HostApplicationsService,
  type CreateHostApplicationInput,
} from "../hosts/host-applications.service";
import {
  optionalIsoDate,
  optionalString,
  requireIsoDate,
  requireRecord,
  requireString,
  requireStringArray,
  requireTrue,
} from "../common/validation";

/**
 * Onboarding service.
 *
 * Implements the locked Caller/Host onboarding lifecycle. Role selection
 * happens exactly once here and is immutable afterwards — the browser never
 * decides or overrides a role; the server reads the durable profile.
 *
 * Caller path: profile info + legal/safety acknowledgements → done.
 * Host path: host profile + application (+ legal/safety acknowledgements) →
 * pending review. A Host is not eligible until administrative approval.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService,
    private readonly users: UsersService,
    private readonly profiles: ProfilesService,
    private readonly applications: HostApplicationsService,
  ) {}

  private client(): SupabaseClient {
    const client = this.supabase.getService();
    if (!client) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    return client;
  }

  /** Resolve the full onboarding state for an authenticated user. */
  async getState(supabaseUserId: string): Promise<OnboardingStateResponse> {
    const profile = await this.users.getOrCreateProfile(supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    return this.buildState(profile);
  }

  /**
   * Complete Caller onboarding. Assigns the fixed Caller role, records the
   * caller profile and the required legal/safety acknowledgements.
   */
  async completeCaller(
    supabaseUserId: string,
    body: CompleteCallerOnboardingRequest,
  ): Promise<OnboardingStateResponse> {
    requireTrue(body?.acceptTerms, "acceptTerms");
    requireTrue(body?.acceptPrivacy, "acceptPrivacy");
    requireTrue(body?.acceptCommunitySafety, "acceptCommunitySafety");
    const displayName = requireString(body?.displayName, "displayName", {
      max: 80,
    });
    const dateOfBirth = optionalIsoDate(body?.dateOfBirth, "dateOfBirth");
    const gender = optionalString(body?.gender, "gender", { max: 40 });

    let profile = await this.users.getOrCreateProfile(supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    if (profile.role === UserRole.Caller) {
      // Idempotent: re-submitting Caller onboarding returns current state.
      return this.buildState(profile);
    }
    profile = await this.users.assignRoleOnce(profile, UserRole.Caller);
    profile = await this.users.updateDisplayName(profile, displayName);

    const { error } = await this.client()
      .from("caller_profiles")
      .upsert(
        {
          profile_id: profile.id,
          date_of_birth: dateOfBirth,
          gender,
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );
    if (error) {
      this.logger.error(
        `Failed to create caller profile for ${profile.id}: ${error.message}`,
      );
      throw new ServiceUnavailableException("Could not complete onboarding");
    }

    await this.profiles.recordLegalAcceptances(profile.id);
    return this.buildState(profile);
  }

  /**
   * Complete Host onboarding: assigns the fixed Host role, creates the host
   * profile, records legal/safety acknowledgements and submits the Host
   * application (status pending). Eligibility requires admin approval.
   */
  async completeHost(
    supabaseUserId: string,
    body: SubmitHostOnboardingRequest,
  ): Promise<OnboardingStateResponse> {
    requireTrue(body?.acceptTerms, "acceptTerms");
    requireTrue(body?.acceptPrivacy, "acceptPrivacy");
    requireTrue(body?.acceptCommunitySafety, "acceptCommunitySafety");
    const displayName = requireString(body?.displayName, "displayName", {
      max: 80,
    });
    const dateOfBirth = requireIsoDate(body?.dateOfBirth, "dateOfBirth");
    const languages = requireStringArray(body?.languages, "languages", {
      maxItems: 10,
    });
    const bio = requireString(body?.bio, "bio", { min: 20, max: 500 });
    const payoutDetails = requireRecord(body?.payoutDetails, "payoutDetails");
    const payoutInput: CreateHostApplicationInput = {
      dateOfBirth,
      languages,
      bio,
      payoutDetails,
    };

    let profile = await this.users.getOrCreateProfile(supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    // Reject before any mutation: while an application is pending or approved,
    // re-submission must not rewrite the display name or host profile. A
    // rejected application may re-apply (handled by createApplication).
    const existingApplication = await this.applications.getCurrentApplication(
      profile.id,
    );
    if (
      existingApplication &&
      (existingApplication.status === HostApplicationStatus.Pending ||
        existingApplication.status === HostApplicationStatus.Approved)
    ) {
      throw new ConflictException(
        "An active Host application already exists for this account",
      );
    }
    if (profile.role !== UserRole.Host) {
      // First Host onboarding: assign the fixed role exactly once.
      profile = await this.users.assignRoleOnce(profile, UserRole.Host);
    }
    // A rejected Host keeps the Host role and may re-apply below; the
    // application service rejects duplicate active applications.
    profile = await this.users.updateDisplayName(profile, displayName);

    const { error } = await this.client()
      .from("host_profiles")
      .upsert(
        {
          profile_id: profile.id,
          bio,
          languages,
          profile_completed_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );
    if (error) {
      this.logger.error(
        `Failed to create host profile for ${profile.id}: ${error.message}`,
      );
      throw new ServiceUnavailableException("Could not complete onboarding");
    }

    await this.applications.createApplication(profile, payoutInput);
    await this.profiles.recordLegalAcceptances(profile.id);
    return this.buildState(profile);
  }

  private async buildState(profile: Profile): Promise<OnboardingStateResponse> {
    const [callerProfile, hostProfile, hostApplication] = await Promise.all([
      this.profiles.getCallerProfile(profile.id),
      this.profiles.getHostProfile(profile.id),
      this.profiles.getLatestHostApplication(profile.id),
    ]);

    const needsRoleSelection = profile.role === null;
    const onboardingComplete =
      profile.role === UserRole.Caller
        ? callerProfile?.onboardingCompletedAt != null
        : profile.role === UserRole.Host
          ? hostProfile?.profileCompletedAt != null &&
            hostApplication !== null
          : false;

    return {
      profile,
      needsRoleSelection,
      callerProfile,
      hostProfile,
      hostApplication,
      onboardingComplete,
      rateBounds: {
        min: this.config.host.rateMinCoins,
        max: this.config.host.rateMaxCoins,
      },
    };
  }
}
