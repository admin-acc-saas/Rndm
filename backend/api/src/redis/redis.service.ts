import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { AppConfigService } from "../config/app-config.service";

/**
 * Redis client provider.
 *
 * Redis is a day-one architecture component used for short-lived operational
 * state (host presence/availability, reservations, locks, rate limiting). It
 * is NEVER the durable source of truth for business records — those live in
 * PostgreSQL. When REDIS_URL is not configured the client resolves to `null`
 * and dependent features degrade honestly instead of pretending to work.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const url = this.config.redis.url;
    if (!url) {
      this.logger.warn(
        "REDIS_URL is not configured — Redis-dependent features (availability, queues) are disabled.",
      );
      return;
    }
    this.client = new Redis(url, {
      // Do not buffer commands while disconnected: callers should see an
      // honest failure instead of hanging.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });
    this.client.on("error", (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
    }
  }

  /** The connected client, or `null` when Redis is not configured. */
  getClient(): Redis | null {
    return this.client;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Lightweight connectivity probe used by health checks. */
  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }
}
