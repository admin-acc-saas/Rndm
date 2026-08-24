import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Profile, UserRole } from "@rndm/contracts";
import { UsersService } from "../users/users.service";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";
import { REQUIRE_ROLE_KEY } from "./require-role.decorator";

/**
 * Role authorization guard.
 *
 * Must be applied AFTER {@link SupabaseAuthGuard} so `request.user` exists.
 * Resolves the caller's application profile from the database and compares
 * its server-side role against the `@RequireRole` metadata. The role is
 * never read from the request. The resolved profile is attached to the
 * request as `request.profile` so controllers can reuse it without a second
 * lookup.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<UserRole | undefined>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRole) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      profile?: Profile;
    }>();
    if (!request.user) {
      throw new ForbiddenException("Authentication required");
    }

    const profile = await this.users.getOrCreateProfile(
      request.user.supabaseUserId,
    );
    if (!profile) {
      throw new ServiceUnavailableException("Profile service unavailable");
    }
    if (profile.role !== requiredRole) {
      throw new ForbiddenException(
        "This operation is not permitted for your account role",
      );
    }
    request.profile = profile;
    return true;
  }
}
