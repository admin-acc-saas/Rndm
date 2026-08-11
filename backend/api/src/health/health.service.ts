import { Injectable, Logger } from "@nestjs/common";
import { HealthResponse } from "@rndm/contracts";
import { SupabaseService } from "../supabase/supabase.service";

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

  constructor(private readonly supabase: SupabaseService) {}

  async check(): Promise<HealthResponse> {
    const database = await this.checkDatabase();
    return {
      status: database === "ok" ? "ok" : "degraded",
      service: "rndm-api",
      timestamp: new Date().toISOString(),
      dependencies: { database },
    };
  }

  private async checkDatabase(): Promise<HealthResponse["dependencies"]["database"]> {
    const client = this.supabase.getService();
    if (!client) return "unconfigured";
    try {
      // A trivial query against the profiles table. We only care that the
      // database responds, not in the row content.
      const { error } = await client
        .from("profiles")
        .select("id", { count: "exact", head: true });
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
