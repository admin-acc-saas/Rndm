import { Module, Global } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfigService } from "./app-config.service";
import { appConfigValidationSchema } from "./app-config.schema";

/**
 * Centralized application configuration.
 *
 * Environment variables are loaded and validated once at boot. The
 * `AppConfigService` exposes a typed, frozen view of the resolved config to
 * the rest of the backend. Secrets are never logged and never shipped to any
 * client.
 *
 * The module is global so every feature module can inject
 * `AppConfigService` without re-importing ConfigModule.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw: Record<string, unknown>) => {
        const result = appConfigValidationSchema(raw);
        if (!result.ok) {
          // Failing fast during config validation surfaces a clear message at
          // boot instead of running in a broken state.
          throw new Error(result.error);
        }
        return result.config;
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
