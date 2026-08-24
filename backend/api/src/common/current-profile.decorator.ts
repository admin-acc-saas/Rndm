import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Profile } from "@rndm/contracts";

/**
 * Parameter decorator resolving the application profile attached by
 * {@link RolesGuard}. Only usable on endpoints protected by that guard.
 */
export const CurrentProfile = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Profile => {
    const request = ctx.switchToHttp().getRequest<{ profile?: Profile }>();
    return request.profile as Profile;
  },
);
