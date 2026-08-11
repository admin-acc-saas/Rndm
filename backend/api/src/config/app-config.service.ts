import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "./app-config.schema";

/**
 * Typed accessor for the validated application configuration.
 *
 * Consumers should depend on this rather than the raw `ConfigService` so the
 * config shape is enforced by the type system.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  get app(): AppConfig["app"] {
    return this.config.get("app", { infer: true }) as AppConfig["app"];
  }

  get supabase(): AppConfig["supabase"] {
    return this.config.get("supabase", { infer: true }) as AppConfig["supabase"];
  }
}
