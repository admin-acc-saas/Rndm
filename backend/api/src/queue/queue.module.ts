import { DynamicModule, Global, Logger, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import type { RedisOptions } from "ioredis";
import { QueueService } from "./queue.service";

/** Parse a REDIS_URL into BullMQ/ioredis connection options. */
export function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  const options: RedisOptions = {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname && parsed.pathname !== "/"
      ? Number.parseInt(parsed.pathname.slice(1), 10)
      : 0,
    // BullMQ workers require this; setting it globally is harmless.
    maxRetriesPerRequest: null,
  };
  if (parsed.protocol === "rediss:") {
    options.tls = {};
  }
  return options;
}

/**
 * BullMQ queue infrastructure.
 *
 * BullMQ runs inside this NestJS backend on top of Redis (per the locked
 * architecture) and will carry durable asynchronous work — notifications,
 * payment webhook processing, settlement, cleanup and reconciliation — in
 * later phases. Phase 3 initializes the shared connection only; no jobs are
 * invented for demonstration purposes.
 *
 * When REDIS_URL is not configured the module boots without BullMQ and
 * `QueueService.enabled` is false, so dependents degrade honestly instead of
 * crashing at startup.
 */
@Global()
@Module({})
export class QueueModule {
  private static readonly logger = new Logger(QueueModule.name);

  static forRoot(): DynamicModule {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn(
        "REDIS_URL is not configured — BullMQ queues are disabled.",
      );
      return {
        module: QueueModule,
        providers: [{ provide: QueueService, useValue: new QueueService(false) }],
        exports: [QueueService],
      };
    }
    return {
      module: QueueModule,
      imports: [BullModule.forRoot({ connection: parseRedisUrl(url) })],
      providers: [{ provide: QueueService, useValue: new QueueService(true) }],
      exports: [QueueService, BullModule],
    };
  }
}
