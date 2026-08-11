import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseModule } from "../supabase/supabase.module";
import { UsersModule } from "../users/users.module";

/**
 * Authentication module.
 *
 * Validates Supabase Auth access tokens on incoming requests and resolves the
 * authenticated user to an application profile. Supabase remains the
 * authentication identity; this module does not re-implement authentication.
 */
@Module({
  imports: [SupabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
