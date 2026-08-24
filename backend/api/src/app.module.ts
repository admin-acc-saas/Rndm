import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { HostsModule } from "./hosts/hosts.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { EligibilityModule } from "./eligibility/eligibility.module";
import { AvailabilityModule } from "./availability/availability.module";

/**
 * Root application module.
 *
 * Module boundaries are kept clean so future modules (matching, calls,
 * payments, notifications, admin, analytics, livekit, moderation) can be
 * added without restructuring the existing ones.
 */
@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    RedisModule,
    QueueModule.forRoot(),
    RolesModule,
    UsersModule,
    ProfilesModule,
    HostsModule,
    OnboardingModule,
    EligibilityModule,
    AvailabilityModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
