import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "./supabase-auth.guard";

/**
 * Parameter decorator that resolves the authenticated Supabase user attached by
 * the {@link SupabaseAuthGuard}. Controllers use this instead of trusting a
 * client-supplied user id.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    return request.user as AuthenticatedUser;
  },
);
