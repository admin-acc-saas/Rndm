import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@rndm/contracts";

export const REQUIRE_ROLE_KEY = "rndm:requireRole";

/**
 * Marks an endpoint as restricted to a fixed product role. Enforced by
 * {@link RolesGuard} against the server-side profile — never against a
 * client-supplied role value.
 */
export const RequireRole = (role: UserRole) =>
  SetMetadata(REQUIRE_ROLE_KEY, role);
