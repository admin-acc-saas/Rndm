import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import type { AuthenticatedUser } from "../auth/supabase-auth.guard";

/**
 * Administrative authorization guard.
 *
 * Must be applied AFTER {@link SupabaseAuthGuard}. Administrative access is
 * granted to the explicit ADMIN_EMAILS allowlist only. There is no Admin
 * product role in the database (per the specification, Admin exists only in
 * the web Admin Dashboard and there is no Super Admin), so the allowlist is
 * the auditable Phase 3 boundary the future dashboard will build on. When the
 * allowlist is empty, all administrative endpoints are closed.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const email = request.user?.email?.toLowerCase();
    const allowed = this.config.admin.emails.map((e) => e.toLowerCase());
    if (!email || !allowed.includes(email)) {
      throw new ForbiddenException("Administrative access required");
    }
    return true;
  }
}
