import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CallerProfile,
  HostApplication,
  HostApplicationStatus,
  HostProfile,
  LegalAcceptance,
  LegalDocumentType,
  MyProfileResponse,
  Profile,
  UpdateHostProfileRequest,
} from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { AppConfigService } from "../config/app-config.service";
import { requireIntInRange, requireString, requireStringArray } from "../common/validation";

/**
 * Profile data service.
 *
 * Reads and updates the Caller/Host subprofiles and legal acceptance records
 * associated with an application profile. All writes use the service-role
 * client; RLS is designed for direct client reads only.
 */
@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService,
  ) {}

  private client(): SupabaseClient {
    const client = this.supabase.getService();
    if (!client) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    return client;
  }

  async getCallerProfile(profileId: string): Promise<CallerProfile | null> {
    const { data, error } = await this.client()
      .from("caller_profiles")
      .select("id, profile_id, date_of_birth, gender, onboarding_completed_at, created_at, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) {
      this.logger.error(`Failed to load caller profile ${profileId}: ${error.message}`);
      return null;
    }
    return data ? this.mapCallerProfile(data) : null;
  }

  async getHostProfile(profileId: string): Promise<HostProfile | null> {
    const { data, error } = await this.client()
      .from("host_profiles")
      .select("id, profile_id, bio, languages, rate_per_minute, profile_completed_at, created_at, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error) {
      this.logger.error(`Failed to load host profile ${profileId}: ${error.message}`);
      return null;
    }
    return data ? this.mapHostProfile(data) : null;
  }

  /**
   * The most recent Host application for a profile (any status). The active
   * one (pending/approved) is unique by database constraint.
   */
  async getLatestHostApplication(
    profileId: string,
  ): Promise<HostApplication | null> {
    const { data, error } = await this.client()
      .from("host_applications")
      .select(
        "id, profile_id, status, date_of_birth, languages, bio, payout_details, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at",
      )
      .eq("profile_id", profileId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.error(`Failed to load host application for ${profileId}: ${error.message}`);
      return null;
    }
    return data ? this.mapHostApplication(data) : null;
  }

  async getLegalAcceptances(profileId: string): Promise<LegalAcceptance[]> {
    const { data, error } = await this.client()
      .from("legal_acceptances")
      .select("id, profile_id, document_type, version, accepted_at")
      .eq("profile_id", profileId);
    if (error) {
      this.logger.error(`Failed to load legal acceptances for ${profileId}: ${error.message}`);
      return [];
    }
    return (data ?? []).map((row) => this.mapLegalAcceptance(row));
  }

  async getMyProfile(profile: Profile): Promise<MyProfileResponse> {
    const [callerProfile, hostProfile, hostApplication, legalAcceptances] =
      await Promise.all([
        this.getCallerProfile(profile.id),
        this.getHostProfile(profile.id),
        this.getLatestHostApplication(profile.id),
        this.getLegalAcceptances(profile.id),
      ]);
    return { profile, callerProfile, hostProfile, hostApplication, legalAcceptances };
  }

  /**
   * Update Host-editable profile fields. The calling rate is constrained by
   * platform-configured bounds (never hardcoded economics).
   */
  async updateHostProfile(
    profile: Profile,
    dto: UpdateHostProfileRequest,
  ): Promise<HostProfile> {
    const existing = await this.getHostProfile(profile.id);
    if (!existing) {
      throw new BadRequestException("Host profile does not exist");
    }

    const update: Record<string, unknown> = {};
    if (dto.bio !== undefined) {
      update.bio = requireString(dto.bio, "bio", { max: 500 });
    }
    if (dto.languages !== undefined) {
      update.languages = requireStringArray(dto.languages, "languages", {
        maxItems: 10,
      });
    }
    if (dto.ratePerMinute !== undefined) {
      update.rate_per_minute = requireIntInRange(
        dto.ratePerMinute,
        "ratePerMinute",
        this.config.host.rateMinCoins,
        this.config.host.rateMaxCoins,
      );
    }
    if (Object.keys(update).length === 0) {
      return existing;
    }

    const { data, error } = await this.client()
      .from("host_profiles")
      .update(update)
      .eq("id", existing.id)
      .select("id, profile_id, bio, languages, rate_per_minute, profile_completed_at, created_at, updated_at")
      .single();
    if (error || !data) {
      this.logger.error(`Failed to update host profile ${profile.id}: ${error?.message}`);
      throw new ServiceUnavailableException("Could not update host profile");
    }
    return this.mapHostProfile(data);
  }

  /** Record legal/policy acceptances. Idempotent per document version. */
  async recordLegalAcceptances(profileId: string): Promise<void> {
    const version = this.config.legal.documentsVersion;
    const rows = [
      LegalDocumentType.Terms,
      LegalDocumentType.Privacy,
      LegalDocumentType.CommunitySafety,
    ].map((documentType) => ({
      profile_id: profileId,
      document_type: documentType,
      version,
    }));
    const { error } = await this.client()
      .from("legal_acceptances")
      .upsert(rows, { onConflict: "profile_id,document_type,version" });
    if (error) {
      this.logger.error(`Failed to record legal acceptances for ${profileId}: ${error.message}`);
      throw new ServiceUnavailableException("Could not record legal acceptances");
    }
  }

  mapCallerProfile(row: Record<string, unknown>): CallerProfile {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      dateOfBirth: row.date_of_birth === null ? null : String(row.date_of_birth),
      gender: row.gender === null ? null : String(row.gender),
      onboardingCompletedAt:
        row.onboarding_completed_at === null ? null : String(row.onboarding_completed_at),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  mapHostProfile(row: Record<string, unknown>): HostProfile {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      bio: row.bio === null ? null : String(row.bio),
      languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
      ratePerMinute:
        row.rate_per_minute === null ? null : Number(row.rate_per_minute),
      profileCompletedAt:
        row.profile_completed_at === null ? null : String(row.profile_completed_at),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  mapHostApplication(row: Record<string, unknown>): HostApplication {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      status: String(row.status) as HostApplicationStatus,
      dateOfBirth: String(row.date_of_birth),
      languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
      bio: String(row.bio),
      payoutDetails:
        typeof row.payout_details === "object" && row.payout_details !== null
          ? (row.payout_details as Record<string, unknown>)
          : {},
      submittedAt: String(row.submitted_at),
      reviewedAt: row.reviewed_at === null ? null : String(row.reviewed_at),
      reviewedByProfileId:
        row.reviewed_by === null ? null : String(row.reviewed_by),
      rejectionReason:
        row.rejection_reason === null ? null : String(row.rejection_reason),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapLegalAcceptance(row: Record<string, unknown>): LegalAcceptance {
    return {
      id: String(row.id),
      profileId: String(row.profile_id),
      documentType: String(row.document_type) as LegalDocumentType,
      version: String(row.version),
      acceptedAt: String(row.accepted_at),
    };
  }
}
