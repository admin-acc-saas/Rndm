import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HostApplication,
  HostApplicationStatus,
  Profile,
} from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { ProfilesService } from "../profiles/profiles.service";

export interface CreateHostApplicationInput {
  dateOfBirth: string;
  languages: string[];
  bio: string;
  payoutDetails: Record<string, unknown>;
}

/**
 * Host application lifecycle service.
 *
 * Owns durable Host application state: creation, review transitions and the
 * append-only audit trail. Status is never client-supplied on writes other
 * than creation (always `pending`); only administrative review can move an
 * application to `approved` or `rejected`.
 */
@Injectable()
export class HostApplicationsService {
  private readonly logger = new Logger(HostApplicationsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly profiles: ProfilesService,
  ) {}

  private client(): SupabaseClient {
    const client = this.supabase.getService();
    if (!client) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    return client;
  }

  /** The current application for a profile (latest submission, any status). */
  async getCurrentApplication(
    profileId: string,
  ): Promise<HostApplication | null> {
    return this.profiles.getLatestHostApplication(profileId);
  }

  /**
   * Create a new pending application. The database partial unique index
   * (host_applications_one_active_idx) prevents duplicate active
   * applications; the explicit pre-check gives a clean error message.
   */
  async createApplication(
    profile: Profile,
    input: CreateHostApplicationInput,
  ): Promise<HostApplication> {
    const existing = await this.getCurrentApplication(profile.id);
    if (
      existing &&
      (existing.status === HostApplicationStatus.Pending ||
        existing.status === HostApplicationStatus.Approved)
    ) {
      throw new ConflictException(
        "An active Host application already exists for this account",
      );
    }

    const { data, error } = await this.client()
      .from("host_applications")
      .insert({
        profile_id: profile.id,
        status: HostApplicationStatus.Pending,
        date_of_birth: input.dateOfBirth,
        languages: input.languages,
        bio: input.bio,
        payout_details: input.payoutDetails,
      })
      .select(
        "id, profile_id, status, date_of_birth, languages, bio, payout_details, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique violation: concurrent submission created an active
        // application between the pre-check and the insert.
        throw new ConflictException(
          "An active Host application already exists for this account",
        );
      }
      this.logger.error(
        `Failed to create host application for ${profile.id}: ${error.message}`,
      );
      throw new ServiceUnavailableException("Could not submit application");
    }

    const application = this.profiles.mapHostApplication(data);
    await this.recordEvent(application.id, null, HostApplicationStatus.Pending, null, null);
    return application;
  }

  /** List applications for administrative review, optionally by status. */
  async listApplications(
    status?: HostApplicationStatus,
  ): Promise<HostApplication[]> {
    let query = this.client()
      .from("host_applications")
      .select(
        "id, profile_id, status, date_of_birth, languages, bio, payout_details, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at",
      )
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (status) {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) {
      this.logger.error(`Failed to list host applications: ${error.message}`);
      throw new ServiceUnavailableException("Could not list applications");
    }
    return (data ?? []).map((row) => this.profiles.mapHostApplication(row));
  }

  /** Approve a pending application (administrative review). */
  async approve(
    applicationId: string,
    adminProfile: Profile,
  ): Promise<HostApplication> {
    return this.transition(
      applicationId,
      HostApplicationStatus.Approved,
      adminProfile,
      null,
    );
  }

  /** Reject a pending application (administrative review). */
  async reject(
    applicationId: string,
    adminProfile: Profile,
    reason: string,
  ): Promise<HostApplication> {
    return this.transition(
      applicationId,
      HostApplicationStatus.Rejected,
      adminProfile,
      reason,
    );
  }

  /**
   * Move an application to a final status. Only `pending` applications can be
   * reviewed; the conditional update keeps the transition race-safe so two
   * reviewers cannot double-process the same application.
   */
  private async transition(
    applicationId: string,
    toStatus: HostApplicationStatus.Approved | HostApplicationStatus.Rejected,
    adminProfile: Profile,
    rejectionReason: string | null,
  ): Promise<HostApplication> {
    const { data, error } = await this.client()
      .from("host_applications")
      .update({
        status: toStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminProfile.id,
        rejection_reason: rejectionReason,
      })
      .eq("id", applicationId)
      .eq("status", HostApplicationStatus.Pending)
      .select(
        "id, profile_id, status, date_of_birth, languages, bio, payout_details, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Failed to review host application ${applicationId}: ${error.message}`,
      );
      throw new ServiceUnavailableException("Could not review application");
    }
    if (!data) {
      const existing = await this.findById(applicationId);
      if (!existing) {
        throw new NotFoundException("Host application not found");
      }
      throw new ConflictException(
        "Only a pending application can be reviewed",
      );
    }

    const application = this.profiles.mapHostApplication(data);
    await this.recordEvent(
      application.id,
      HostApplicationStatus.Pending,
      toStatus,
      adminProfile.id,
      rejectionReason,
    );
    return application;
  }

  private async findById(id: string): Promise<HostApplication | null> {
    const { data, error } = await this.client()
      .from("host_applications")
      .select(
        "id, profile_id, status, date_of_birth, languages, bio, payout_details, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      this.logger.error(`Failed to load host application ${id}: ${error.message}`);
      return null;
    }
    return data ? this.profiles.mapHostApplication(data) : null;
  }

  /** Append an immutable audit event. Failures are logged, not swallowed. */
  private async recordEvent(
    applicationId: string,
    fromStatus: HostApplicationStatus | null,
    toStatus: HostApplicationStatus,
    actorProfileId: string | null,
    note: string | null,
  ): Promise<void> {
    const { error } = await this.client()
      .from("host_application_events")
      .insert({
        application_id: applicationId,
        from_status: fromStatus,
        to_status: toStatus,
        actor_profile_id: actorProfileId,
        note,
      });
    if (error) {
      this.logger.error(
        `Failed to record audit event for application ${applicationId}: ${error.message}`,
      );
    }
  }
}
