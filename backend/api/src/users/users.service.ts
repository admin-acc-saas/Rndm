import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AccountStatus, Profile, UserRole } from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { RolesService } from "../roles/roles.service";

const PROFILES_TABLE = "profiles";

/**
 * Application profile service.
 *
 * Reads and (lazily) creates the application `profiles` row for an
 * authenticated Supabase user. All writes use the service-role client so RLS
 * does not block trusted server-side operations.
 *
 * A new profile has NO role: the user selects Caller or Host exactly once
 * during onboarding, after which the role is immutable (enforced here and by
 * the profiles_lock_role database trigger). Onboarding lives in the
 * onboarding module; this service only resolves and reads profiles.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly roles: RolesService,
  ) {}

  /**
   * Load the profile for a Supabase user ID, creating a default one if absent.
   * Returns `null` when Supabase is not configured (e.g. local tests without
   * credentials).
   */
  async getOrCreateProfile(supabaseUserId: string): Promise<Profile | null> {
    const client = this.supabase.getService();
    if (!client) return null;

    const existing = await this.findBySupabaseUserId(client, supabaseUserId);
    if (existing) return existing;

    return this.createDefaultProfile(client, supabaseUserId);
  }

  /** Look up a profile by its Supabase Auth user id. */
  async findBySupabaseUserId(
    client: SupabaseClient,
    supabaseUserId: string,
  ): Promise<Profile | null> {
    const { data, error } = await client
      .from(PROFILES_TABLE)
      .select("id, supabase_user_id, display_name, role, account_status, created_at, updated_at")
      .eq("supabase_user_id", supabaseUserId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Failed to load profile for ${supabaseUserId}: ${error.message}`,
      );
      return null;
    }
    if (!data) return null;
    return this.mapRow(data);
  }

  /**
   * Create a default profile with no role. Role selection happens exactly
   * once during onboarding and is immutable afterwards.
   */
  private async createDefaultProfile(
    client: SupabaseClient,
    supabaseUserId: string,
  ): Promise<Profile | null> {
    const row = {
      supabase_user_id: supabaseUserId,
      display_name: null,
      role: null,
      account_status: AccountStatus.Active,
    };

    const { data, error } = await client
      .from(PROFILES_TABLE)
      .insert(row)
      .select(
        "id, supabase_user_id, display_name, role, account_status, created_at, updated_at",
      )
      .single();

    if (error) {
      this.logger.error(
        `Failed to create profile for ${supabaseUserId}: ${error.message}`,
      );
      return null;
    }
    return this.mapRow(data);
  }

  /**
   * Assign the fixed product role exactly once. The `.is("role", null)`
   * guard makes the write race-safe: two concurrent onboarding requests
   * cannot both set a role. Returns the updated profile.
   */
  async assignRoleOnce(profile: Profile, role: UserRole): Promise<Profile> {
    if (profile.role) {
      throw new ConflictException(
        "Role has already been selected and cannot be changed",
      );
    }
    const client = this.supabase.getService();
    if (!client) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    const { data, error } = await client
      .from(PROFILES_TABLE)
      .update({ role })
      .eq("id", profile.id)
      .is("role", null)
      .select(
        "id, supabase_user_id, display_name, role, account_status, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Failed to assign role for ${profile.supabaseUserId}: ${error.message}`,
      );
      throw new ServiceUnavailableException("Could not assign role");
    }
    if (!data) {
      // Another request set the role first.
      throw new ConflictException(
        "Role has already been selected and cannot be changed",
      );
    }
    return this.mapRow(data);
  }

  /** Update the profile display name. Returns the updated profile. */
  async updateDisplayName(
    profile: Profile,
    displayName: string,
  ): Promise<Profile> {
    const client = this.supabase.getService();
    if (!client) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    const { data, error } = await client
      .from(PROFILES_TABLE)
      .update({ display_name: displayName })
      .eq("id", profile.id)
      .select(
        "id, supabase_user_id, display_name, role, account_status, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      this.logger.error(
        `Failed to update display name for ${profile.supabaseUserId}: ${error?.message}`,
      );
      throw new ServiceUnavailableException("Could not update profile");
    }
    return this.mapRow(data);
  }

  private mapRow(row: Record<string, unknown>): Profile {
    const rawRole = row.role;
    return {
      id: String(row.id),
      supabaseUserId: String(row.supabase_user_id),
      displayName: row.display_name === null ? "" : String(row.display_name),
      role:
        typeof rawRole === "string" && this.roles.isValidRole(rawRole)
          ? rawRole
          : null,
      accountStatus: this.normalizeStatus(row.account_status),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private normalizeStatus(value: unknown): AccountStatus {
    if (value === AccountStatus.Suspended) return AccountStatus.Suspended;
    if (value === AccountStatus.Disabled) return AccountStatus.Disabled;
    return AccountStatus.Active;
  }
}
