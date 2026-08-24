import { Module } from "@nestjs/common";
import { HostsModule } from "../hosts/hosts.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { UsersModule } from "../users/users.module";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

/**
 * Onboarding module.
 *
 * Separate Caller and Host onboarding paths with one-time, immutable role
 * selection. The Host path creates the durable application consumed by the
 * review lifecycle.
 */
@Module({
  imports: [UsersModule, ProfilesModule, HostsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
