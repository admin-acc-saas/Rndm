import { Module } from "@nestjs/common";
import { ProfilesModule } from "../profiles/profiles.module";
import { UsersModule } from "../users/users.module";
import { EligibilityController } from "./eligibility.controller";
import { EligibilityService } from "./eligibility.service";

/**
 * Eligibility module.
 *
 * Exposes the single authoritative Host eligibility boundary used by the
 * availability module now and the future matching service later.
 */
@Module({
  imports: [UsersModule, ProfilesModule],
  controllers: [EligibilityController],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
