import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { RedisService } from "./redis.service";

/**
 * Redis module. Global so availability, queues and future modules (matching,
 * reservations, rate limiting) share one connection without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
