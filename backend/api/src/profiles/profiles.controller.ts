import {
  Body,
  Controller,
  Get,
  Patch,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type {
  HostProfile,
  MyProfileResponse,
  Profile,
  UpdateHostProfileRequest,
  UpdateProfileRequest,
} from "@rndm/contracts";
import { UserRole } from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { CurrentProfile } from "../common/current-profile.decorator";
import { RequireRole } from "../common/require-role.decorator";
import { RolesGuard } from "../common/roles.guard";
import { optionalString } from "../common/validation";
import { UsersService } from "../users/users.service";
import { ProfilesService } from "./profiles.service";

/**
 * Profile endpoints.
 *
 * `GET /profiles/me` returns the full application profile view for the
 * authenticated user. Updates are restricted to safe, user-editable fields;
 * role, account status and review state are never client-editable.
 */
@Controller("profiles")
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly users: UsersService,
  ) {}

  @Get("me")
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyProfileResponse> {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    return this.profiles.getMyProfile(profile);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileRequest,
  ): Promise<Profile> {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    const displayName = optionalString(body?.displayName, "displayName", {
      max: 80,
    });
    if (displayName === null) return profile;
    return this.users.updateDisplayName(profile, displayName);
  }

  @Patch("me/host")
  @UseGuards(RolesGuard)
  @RequireRole(UserRole.Host)
  async updateHostProfile(
    @CurrentProfile() profile: Profile,
    @Body() body: UpdateHostProfileRequest,
  ): Promise<HostProfile> {
    return this.profiles.updateHostProfile(profile, body ?? {});
  }
}
