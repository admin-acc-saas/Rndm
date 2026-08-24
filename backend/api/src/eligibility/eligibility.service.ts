import { Injectable } from "@nestjs/common";
import {
  AccountStatus,
  HostApplicationStatus,
  HostEligibilityResult,
  Profile,
  UserRole,
} from "@rndm/contracts";
import { ProfilesService } from "../profiles/profiles.service";

/**
 * Host eligibility service — the single authoritative rule boundary.
 *
 * A Host is eligible for future matching only when every durable condition
 * holds: fixed host role, active account, approved application and a
 * completed host profile. Operational availability (online/offline) is
 * evaluated separately by the availability service; the future matching
 * service consumes both this eligibility result and availability state
 * instead of rebuilding the rules.
 *
 * Clients never compute eligibility themselves; they only display the
 * server-computed result.
 */
@Injectable()
export class EligibilityService {
  constructor(private readonly profiles: ProfilesService) {}

  async evaluateHost(profile: Profile): Promise<HostEligibilityResult> {
    const roleIsHost = profile.role === UserRole.Host;
    const accountActive = profile.accountStatus === AccountStatus.Active;

    const application = await this.profiles.getLatestHostApplication(
      profile.id,
    );
    const applicationApproved =
      application?.status === HostApplicationStatus.Approved;

    const hostProfile = await this.profiles.getHostProfile(profile.id);
    const hostProfileComplete =
      hostProfile !== null &&
      hostProfile.profileCompletedAt !== null &&
      hostProfile.bio !== null &&
      hostProfile.bio.length > 0 &&
      hostProfile.languages.length > 0;

    const checks = {
      authenticated: true,
      roleIsHost,
      accountActive,
      applicationApproved,
      hostProfileComplete,
    };

    const reasons: string[] = [];
    if (!roleIsHost) reasons.push("Account role is not Host");
    if (!accountActive) reasons.push("Account is not active");
    if (!applicationApproved) {
      reasons.push(
        application
          ? `Host application is ${application.status}`
          : "No Host application submitted",
      );
    }
    if (!hostProfileComplete) reasons.push("Host profile is incomplete");

    return {
      eligible: Object.values(checks).every(Boolean),
      checks,
      reasons,
    };
  }
}
