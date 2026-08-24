import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  AvailabilityResponse,
  AvailabilityStatus,
  Profile,
} from "@rndm/contracts";
import { AppConfigService } from "../config/app-config.service";
import { EligibilityService } from "../eligibility/eligibility.service";
import { RedisService } from "../redis/redis.service";

/**
 * Host availability service.
 *
 * Availability is short-lived operational state stored in Redis with a TTL:
 * going online is an explicit, eligibility-gated action and the client must
 * heartbeat to remain online. Availability is NEVER durable account state and
 * never "the user opened the page". Only `offline` and `available` exist in
 * this phase; `ringing` and `in_call` are reserved for the future call
 * architecture and are set exclusively by backend call logic.
 *
 * The future matching service must require BOTH {@link EligibilityService}
 * (durable gate) and this availability state (operational gate).
 */
@Injectable()
export class AvailabilityService {
  constructor(
    private readonly redis: RedisService,
    private readonly eligibility: EligibilityService,
    private readonly config: AppConfigService,
  ) {}

  private key(profileId: string): string {
    return `rndm:availability:host:${profileId}`;
  }

  /** Current availability + eligibility view for a Host. */
  async getState(profile: Profile): Promise<AvailabilityResponse> {
    const eligibility = await this.eligibility.evaluateHost(profile);
    const client = this.redis.getClient();
    if (!client) {
      return {
        status: AvailabilityStatus.Offline,
        infrastructure: "unconfigured",
        eligibility,
      };
    }
    const raw = await client.get(this.key(profile.id)).catch(() => null);
    return {
      status:
        raw === AvailabilityStatus.Available
          ? AvailabilityStatus.Available
          : AvailabilityStatus.Offline,
      infrastructure: "ok",
      eligibility,
    };
  }

  /**
   * Go online. Requires full server-side eligibility; an unapproved or
   * suspended Host can never become available.
   */
  async goOnline(profile: Profile): Promise<AvailabilityResponse> {
    const eligibility = await this.eligibility.evaluateHost(profile);
    if (!eligibility.eligible) {
      throw new ForbiddenException(
        `Host is not eligible to go online: ${eligibility.reasons.join("; ")}`,
      );
    }
    const client = this.redis.getClient();
    if (!client) {
      throw new ServiceUnavailableException(
        "Availability infrastructure is not configured",
      );
    }
    await client.set(
      this.key(profile.id),
      AvailabilityStatus.Available,
      "EX",
      this.config.availability.ttlSeconds,
    );
    return {
      status: AvailabilityStatus.Available,
      infrastructure: "ok",
      eligibility,
    };
  }

  /**
   * Refresh the availability TTL. Only an already-online, still-eligible Host
   * may heartbeat; this keeps stale clients from appearing available forever.
   */
  async heartbeat(profile: Profile): Promise<AvailabilityResponse> {
    const client = this.redis.getClient();
    if (!client) {
      throw new ServiceUnavailableException(
        "Availability infrastructure is not configured",
      );
    }
    const raw = await client.get(this.key(profile.id)).catch(() => null);
    if (raw !== AvailabilityStatus.Available) {
      return this.getState(profile);
    }
    const eligibility = await this.eligibility.evaluateHost(profile);
    if (!eligibility.eligible) {
      // Eligibility was revoked (e.g. suspension): drop availability.
      await client.del(this.key(profile.id));
      return {
        status: AvailabilityStatus.Offline,
        infrastructure: "ok",
        eligibility,
      };
    }
    await client.expire(
      this.key(profile.id),
      this.config.availability.ttlSeconds,
    );
    return {
      status: AvailabilityStatus.Available,
      infrastructure: "ok",
      eligibility,
    };
  }

  /** Go offline explicitly. */
  async goOffline(profile: Profile): Promise<AvailabilityResponse> {
    const client = this.redis.getClient();
    if (client) {
      await client.del(this.key(profile.id)).catch(() => undefined);
    }
    const eligibility = await this.eligibility.evaluateHost(profile);
    return {
      status: AvailabilityStatus.Offline,
      infrastructure: client ? "ok" : "unconfigured",
      eligibility,
    };
  }
}
