import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type {
  AdminHostApplicationsResponse,
  HostApplication,
  RejectHostApplicationRequest,
} from "@rndm/contracts";
import { HostApplicationStatus } from "@rndm/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { AdminGuard } from "../common/admin.guard";
import { requireString } from "../common/validation";
import { UsersService } from "../users/users.service";
import { HostApplicationsService } from "./host-applications.service";

/**
 * Administrative Host application review endpoints.
 *
 * These are the API/domain-level review capability the future Admin
 * Dashboard will consume. Phase 3 deliberately ships no admin UI. Access is
 * restricted to the ADMIN_EMAILS allowlist via {@link AdminGuard} on top of
 * normal Supabase authentication; every transition is written to the
 * append-only audit trail.
 */
@Controller("admin/host-applications")
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class AdminHostApplicationsController {
  constructor(
    private readonly users: UsersService,
    private readonly applications: HostApplicationsService,
  ) {}

  @Get()
  async list(
    @Query("status") status?: string,
  ): Promise<AdminHostApplicationsResponse> {
    const parsed = this.parseStatus(status);
    return { applications: await this.applications.listApplications(parsed) };
  }

  @Post(":id/approve")
  async approve(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ application: HostApplication }> {
    const adminProfile = await this.requireAdminProfile(user);
    return {
      application: await this.applications.approve(id, adminProfile),
    };
  }

  @Post(":id/reject")
  async reject(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RejectHostApplicationRequest,
  ): Promise<{ application: HostApplication }> {
    const adminProfile = await this.requireAdminProfile(user);
    const reason = requireString(body?.reason, "reason", { max: 500 });
    return {
      application: await this.applications.reject(id, adminProfile, reason),
    };
  }

  private async requireAdminProfile(user: AuthenticatedUser) {
    const profile = await this.users.getOrCreateProfile(user.supabaseUserId);
    if (!profile) {
      throw new UnauthorizedException("Profile service unavailable");
    }
    return profile;
  }

  private parseStatus(status?: string): HostApplicationStatus | undefined {
    if (status === undefined) return undefined;
    if (
      status === HostApplicationStatus.Pending ||
      status === HostApplicationStatus.Approved ||
      status === HostApplicationStatus.Rejected
    ) {
      return status;
    }
    throw new BadRequestException("status must be pending, approved or rejected");
  }
}
