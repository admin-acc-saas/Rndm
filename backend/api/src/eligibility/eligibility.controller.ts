import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { HostEligibilityResult } from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { UsersService } from "../users/users.service";
import { EligibilityService } from "./eligibility.service";

/**
 * Eligibility endpoints.
 *
 * `GET /eligibility/me` returns the server-computed Host eligibility result
 * for the authenticated user. Non-host accounts receive a truthful result
 * with failing checks rather than an error, so the UI can render state
 * without special-casing.
 */
@Controller("eligibility")
@UseGuards(SupabaseAuthGuard)
export class EligibilityController {
  constructor(
    private readonly users: UsersService,
    private readonly eligibility: EligibilityService,
  ) {}

  @Get("me")
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HostEligibilityResult> {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    return this.eligibility.evaluateHost(profile);
  }
}
