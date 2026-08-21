import { Injectable, Logger } from "@nestjs/common";
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
 * In Phase 2, profile auto-creation is intentionally minimal: a new profile
 * defaults to the `caller` role and `active` status. Role selection /
 * onboarding is a later phase; here we guarantee an authenticated user has a
 * profile row that downstream endpoints can read.
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
   * Create a default profile. Defaults to Caller role + active status; real
   * role selection/onboarding happens in a later phase.
   */
  private async createDefaultProfile(
    client: SupabaseClient,
    supabaseUserId: string,
  ): Promise<Profile | null> {
    const row = {
      supabase_user_id: supabaseUserId,
      display_name: null,
      role: UserRole.Caller,
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

  private mapRow(row: Record<string, unknown>): Profile {
    return {
      id: String(row.id),
      supabaseUserId: String(row.supabase_user_id),
      displayName: row.display_name === null ? "" : String(row.display_name),
      role: this.roles.isValidRole(String(row.role))
        ? (String(row.role) as UserRole)
        : UserRole.Caller,
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
