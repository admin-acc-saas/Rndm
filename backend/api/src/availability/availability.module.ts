import { Module } from "@nestjs/common";
import { EligibilityModule } from "../eligibility/eligibility.module";
import { UsersModule } from "../users/users.module";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";

/**
 * Availability module.
 *
 * Server-authoritative Host availability (Redis, TTL-based) gated by the
 * eligibility boundary. RINGING/IN_CALL and LiveKit belong to later phases.
 */
@Module({
  imports: [UsersModule, EligibilityModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
