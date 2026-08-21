import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfigService } from "../config/app-config.service";

/**
 * Server-side Supabase client provider.
 *
 * Clients are lazily created and cached. When Supabase configuration is
 * absent (e.g. in unit tests without real credentials) the clients resolve to
 * `null` and callers must guard against that rather than crashing at boot.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private serviceClient: SupabaseClient | null = null;
  private anonClient: SupabaseClient | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const { url, anonKey, serviceRoleKey } = this.config.supabase;
    if (!url || !anonKey || !serviceRoleKey) {
      this.logger.warn(
        "Supabase credentials are not configured — Supabase clients are disabled. " +
          "Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to enable.",
      );
      return;
    }
    this.serviceClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * The service-role client. Use only for trusted server-side work. Bypasses
   * RLS. Returns `null` when Supabase is not configured.
   */
  getService(): SupabaseClient | null {
    return this.serviceClient;
  }

  /**
   * The anon client. Respects RLS. Returns `null` when Supabase is not
   * configured.
   */
  getAnon(): SupabaseClient | null {
    return this.anonClient;
  }

  get isConfigured(): boolean {
    return this.serviceClient !== null;
  }
}
