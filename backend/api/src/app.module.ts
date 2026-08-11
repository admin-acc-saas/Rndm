import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";

/**
 * Root application module.
 *
 * Module boundaries are kept clean so future modules (matching, calls, hosts,
 * payments, notifications, admin, analytics, livekit, moderation) can be added
 * without restructuring the existing ones.
 */
@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    RolesModule,
    UsersModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
