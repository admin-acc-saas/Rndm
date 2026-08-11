import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import type { CanActivate } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseService } from "../supabase/supabase.service";

/**
 * Authenticated user resolved by the Supabase auth guard. Attached to the
 * request as `request.user`.
 */
export interface AuthenticatedUser {
  supabaseUserId: string;
  email: string | null;
}

/**
 * Supabase auth guard.
 *
 * Extracts the Bearer access token from the Authorization header and verifies
 * it against Supabase Auth using the service-role client. The Supabase user
 * identity (id + email) is the source of truth — we never trust a client-
 * supplied user id.
 *
 * We deliberately avoid Passport strategy boilerplate here to keep
 * dependencies lean; the actual verification is self-contained and implements
 * NestJS's `CanActivate` interface directly.
 *
 * If Supabase is not configured, the guard rejects all requests as unauthorized
 * rather than allowing unauthenticated access.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();

    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length).trim();

    const client = this.supabase.getService();
    if (!client) {
      throw new UnauthorizedException("Authentication is not configured");
    }

    const user = await this.verifyToken(client, token);
    if (!user) {
      throw new UnauthorizedException("Invalid or expired token");
    }
    request.user = user;
    return true;
  }

  private async verifyToken(
    client: SupabaseClient,
    token: string,
  ): Promise<AuthenticatedUser | null> {
    // getUser() verifies the JWT server-side using the service role and
    // returns the user record from Supabase Auth without exposing secrets.
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      if (error) {
        // Log the error code only — never the token or full error payload.
        this.logger.warn(`Token verification failed: ${error.name}`);
      }
      return null;
    }
    return {
      supabaseUserId: data.user.id,
      email: data.user.email ?? null,
    };
  }
}
