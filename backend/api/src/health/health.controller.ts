import { Controller, Get } from "@nestjs/common";
import { HealthResponse } from "@rndm/contracts";
import { HealthService } from "./health.service";

/**
 * Health endpoint.
 *
 * `GET /health` is unauthenticated and returns a structured status object. It
 * is safe to expose publicly and never includes secrets or user data.
 */
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
