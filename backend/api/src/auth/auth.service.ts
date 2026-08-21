import { Injectable, Logger } from "@nestjs/common";
import { AuthMeResponse } from "@rndm/contracts";
import { UsersService } from "../users/users.service";
import type { AuthenticatedUser } from "./supabase-auth.guard";

/**
 * Auth service.
 *
 * Resolves the authenticated Supabase user into an RNDM application profile.
 * The Supabase identity is the source of truth; this service only loads the
 * associated application data.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly users: UsersService) {}

  /**
   * Build the `/auth/me` response for an authenticated user, lazily creating
   * the application profile if it does not yet exist.
   *
   * When Supabase is not configured (local/no-credential environment), the
   * profile is `null` and only the Supabase identity is returned — this keeps
   * the API honest rather than fabricating a profile.
   */
  async getMe(user: AuthenticatedUser): Promise<AuthMeResponse> {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      this.logger.warn(
        `No profile resolution for ${user.supabaseUserId} (Supabase not configured)`,
      );
    }
    return {
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      profile,
    };
  }
}
