import { NestFactory } from "@nestjs/core";
import { NestApplication } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";
import { GlobalExceptionFilter } from "./common/global-exception.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);

  // API contract versioning is documented in docs/architecture. Phase 2 keeps
  // endpoints at the root namespace (/health, /auth/me) to match the spec's
  // explicit examples; a version prefix will be introduced when breaking
  // changes occur.
  app.useGlobalFilters(new GlobalExceptionFilter());
  // Suppress the Express x-powered-by header.
  app.getHttpAdapter().getInstance().disable("x-powered-by");

  // CORS origins are configurable per environment. Wildcard CORS is rejected
  // by config validation in production, so the deployed API only accepts the
  // configured web origins.
  app.enableCors({
    origin: config.app.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  const port = config.app.port;
  await app.listen(port);
  logger.log(`RNDM API listening on http://localhost:${port}`);
  logger.log(`CORS origins: ${config.app.corsOrigins.join(", ")}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger("Bootstrap");
  logger.error("Failed to bootstrap RNDM API", err);
  process.exit(1);
});
