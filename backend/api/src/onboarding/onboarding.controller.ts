import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import type {
  CompleteCallerOnboardingRequest,
  OnboardingStateResponse,
  SubmitHostOnboardingRequest,
} from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { OnboardingService } from "./onboarding.service";

/**
 * Onboarding endpoints.
 *
 * The role is chosen here exactly once and is immutable afterwards. A client
 * cannot pass a role directly: the endpoint selected IS the role choice, and
 * the server enforces one-time assignment against the durable profile.
 */
@Controller("onboarding")
@UseGuards(SupabaseAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("state")
  async getState(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OnboardingStateResponse> {
    return this.onboarding.getState(user.supabaseUserId);
  }

  @Post("caller")
  async completeCaller(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CompleteCallerOnboardingRequest,
  ): Promise<OnboardingStateResponse> {
    return this.onboarding.completeCaller(user.supabaseUserId, body ?? {});
  }

  @Post("host")
  async completeHost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SubmitHostOnboardingRequest,
  ): Promise<OnboardingStateResponse> {
    return this.onboarding.completeHost(user.supabaseUserId, body ?? {});
  }
}
