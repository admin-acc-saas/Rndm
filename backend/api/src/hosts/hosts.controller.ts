import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { HostApplication } from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { UsersService } from "../users/users.service";
import { HostApplicationsService } from "./host-applications.service";

/**
 * Host-facing application endpoints.
 *
 * `GET /hosts/application` returns the caller's own current application
 * (any status) or null when none exists. Application creation happens
 * through Host onboarding (`POST /onboarding/host`).
 */
@Controller("hosts")
@UseGuards(SupabaseAuthGuard)
export class HostsController {
  constructor(
    private readonly users: UsersService,
    private readonly applications: HostApplicationsService,
  ) {}

  @Get("application")
  async getMyApplication(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ application: HostApplication | null }> {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    const application = await this.applications.getCurrentApplication(
      profile.id,
    );
    return { application };
  }
}
