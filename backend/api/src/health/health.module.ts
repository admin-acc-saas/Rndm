import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { SupabaseModule } from "../supabase/supabase.module";

/**
 * Health module.
 *
 * Exposes `GET /health` for liveness/readiness checks. The endpoint reports
 * API process health and database connectivity without leaking secrets.
 */
@Module({
  imports: [SupabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
