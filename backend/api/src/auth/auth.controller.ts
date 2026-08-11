import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthMeResponse } from "@rndm/contracts";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./supabase-auth.guard";

/**
 * Authenticated endpoints.
 *
 * `/auth/me` returns the authenticated user's Supabase identity and the
 * associated application profile. It is the canonical way for a client to
 * learn "who am I" from the backend.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthMeResponse> {
    return this.authService.getMe(user);
  }
}
