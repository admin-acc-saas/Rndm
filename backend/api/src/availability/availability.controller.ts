import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AvailabilityResponse, Profile } from "@rndm/contracts";
import { UserRole } from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentProfile } from "../common/current-profile.decorator";
import { RequireRole } from "../common/require-role.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AvailabilityService } from "./availability.service";

/**
 * Host availability endpoints.
 *
 * Every endpoint requires the fixed Host role (enforced server-side by
 * {@link RolesGuard} — a Caller can never invoke availability operations).
 * Going online additionally requires server-computed eligibility.
 */
@Controller("availability")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRole(UserRole.Host)
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get("me")
  async getMe(@CurrentProfile() profile: Profile): Promise<AvailabilityResponse> {
    return this.availability.getState(profile);
  }

  @Post("online")
  async goOnline(@CurrentProfile() profile: Profile): Promise<AvailabilityResponse> {
    return this.availability.goOnline(profile);
  }

  @Post("heartbeat")
  async heartbeat(@CurrentProfile() profile: Profile): Promise<AvailabilityResponse> {
    return this.availability.heartbeat(profile);
  }

  @Post("offline")
  async goOffline(@CurrentProfile() profile: Profile): Promise<AvailabilityResponse> {
    return this.availability.goOffline(profile);
  }
}
