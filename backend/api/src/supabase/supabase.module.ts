import { Module, Global } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

/**
 * Provides Supabase clients to the backend.
 *
 * Two clients are exposed:
 *
 * - `getService()` — uses the service-role key. Bypasses RLS and is used only
 *   for trusted server-side operations (reading/writing application data,
 *   validating tokens). MUST NEVER be shipped to or reachable from the
 *   browser.
 * - `getAnon()` — uses the anon key. Used for operations that should respect
 *   RLS, mirroring what a client could do directly.
 *
 * The service-role key is held only in memory and never logged.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
