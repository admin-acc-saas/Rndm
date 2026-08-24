import { Injectable, Logger } from "@nestjs/common";
import { HealthResponse } from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";
import { RedisService } from "../redis/redis.service";

/**
 * Health service.
 *
 * Reports API process health and a lightweight database connectivity check.
 * The database check is best-effort: when Supabase is not configured it reports
 * `unconfigured`; on query failure it reports `unavailable`. The endpoint never
 * throws — a failed dependency degrades the status rather than crashing the
 * check.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthResponse> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    return {
      status: database === "ok" ? "ok" : "degraded",
      service: "rndm-api",
      timestamp: new Date().toISOString(),
      dependencies: { database, redis },
    };
  }

  private async checkRedis(): Promise<HealthResponse["dependencies"]["redis"]> {
    if (!this.redis.isConfigured) return "unconfigured";
    return (await this.redis.ping()) ? "ok" : "unavailable";
  }

  private async checkDatabase(): Promise<HealthResponse["dependencies"]["database"]> {
    const client = this.supabase.getService();
    if (!client) return "unconfigured";
    try {
      // A trivial query against the profiles table. We only care that the
      // database responds, not in the row content. This must be a GET: on
      // HEAD requests postgrest-js cannot parse the error body and masks a
      // 404 (missing table) as a 204 success.
      const { error } = await client.from("profiles").select("id").limit(1);
      if (error) {
        this.logger.warn(`Health database probe failed: ${error.message}`);
        return "unavailable";
      }
      return "ok";
    } catch (err) {
      this.logger.warn(`Health database probe threw: ${String(err)}`);
      return "unavailable";
    }
  }
}
