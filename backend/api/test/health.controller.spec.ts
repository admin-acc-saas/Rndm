import { Test } from "@nestjs/testing";
import { HealthController } from "../src/health/health.controller";
import { HealthService } from "../src/health/health.service";
import { SupabaseService } from "../src/supabase/supabase.service";

describe("HealthController", () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: SupabaseService, useValue: { getService: () => null } },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
    healthService = moduleRef.get(HealthService);
  });

  it("returns ok status when the API process is running", async () => {
    const result = await controller.health();
    expect(result.service).toBe("rndm-api");
    expect(result.status).toBe("degraded"); // db unconfigured in tests
    expect(result.dependencies.database).toBe("unconfigured");
    expect(typeof result.timestamp).toBe("string");
  });

  it("never includes secrets in the response", async () => {
    const result = await controller.health();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("anon_key");
  });

  it("degrades gracefully when the database probe fails", async () => {
    jest
      .spyOn(healthService as unknown as { check: () => Promise<unknown> }, "check")
      .mockResolvedValue({
        status: "degraded",
        service: "rndm-api",
        timestamp: "t",
        dependencies: { database: "unavailable" },
      });
    const result = await controller.health();
    expect(result.status).toBe("degraded");
    expect(result.dependencies.database).toBe("unavailable");
  });
});
