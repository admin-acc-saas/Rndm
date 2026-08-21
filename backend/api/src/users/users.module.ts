import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { SupabaseModule } from "../supabase/supabase.module";
import { RolesModule } from "../roles/roles.module";

/**
 * Users (application profile) module.
 *
 * Owns the application-level profile record associated with a Supabase Auth
 * user. Supabase Auth remains the authentication identity; this module holds
 * display name, role and account status.
 */
@Module({
  imports: [SupabaseModule, RolesModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
