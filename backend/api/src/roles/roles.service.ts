import { Injectable } from "@nestjs/common";
import { UserRole } from "@rndm/contracts";

/**
 * Role domain logic for Caller/Host.
 *
 * Per the specification, a user chooses a role at onboarding and cannot freely
 * switch between Caller and Host. Role assignment and any future transition
 * rules live here so they are enforced server-side in one place.
 */
@Injectable()
export class RolesService {
  /** Roles a user may select at onboarding. */
  readonly onboardingRoles: readonly UserRole[] = [
    UserRole.Caller,
    UserRole.Host,
  ];

  /** Validate that a value is a known product role. */
  isValidRole(value: string): value is UserRole {
    return (
      value === UserRole.Caller || value === UserRole.Host
    );
  }

  /**
   * Whether a role transition is allowed. Per the spec, normal users cannot
   * switch roles; only an admin workflow may change a role. This returns
   * `false` for all user-initiated transitions in Phase 2.
   */
  canTransitionRole(_from: UserRole, _to: UserRole): boolean {
    return false;
  }
}
