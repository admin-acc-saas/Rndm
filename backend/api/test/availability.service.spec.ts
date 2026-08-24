import { Test } from "@nestjs/testing";
import {
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  AccountStatus,
  AvailabilityStatus,
  HostEligibilityResult,
  Profile,
  UserRole,
} from "@rndm/contracts";
import { AvailabilityService } from "../src/availability/availability.service";
import { AppConfigService } from "../src/config/app-config.service";
import { EligibilityService } from "../src/eligibility/eligibility.service";
import { RedisService } from "../src/redis/redis.service";

function profile(): Profile {
  return {
    id: "p1",
    supabaseUserId: "u1",
    displayName: "Test",
    role: UserRole.Host,
    accountStatus: AccountStatus.Active,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function eligibility(eligible: boolean): HostEligibilityResult {
  return {
    eligible,
    checks: {
      authenticated: true,
      roleIsHost: true,
      accountActive: true,
      applicationApproved: eligible,
      hostProfileComplete: true,
    },
    reasons: eligible ? [] : ["Host application is pending"],
  };
}

function fakeRedis(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const expiries = new Map<string, number>();
  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string, _ex: string, ttl: number) => {
      store.set(key, value);
      expiries.set(key, ttl);
      return "OK";
    }),
    expire: jest.fn(async (key: string, ttl: number) => {
      expiries.set(key, ttl);
      return 1;
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    _store: store,
    _expiries: expiries,
  };
}

describe("AvailabilityService", () => {
  let service: AvailabilityService;
  let evaluateHost: jest.Mock;
  let redisClient: ReturnType<typeof fakeRedis> | null;

  beforeEach(async () => {
    evaluateHost = jest.fn();
    redisClient = fakeRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: EligibilityService, useValue: { evaluateHost } },
        {
          provide: RedisService,
          useValue: { getClient: () => redisClient },
        },
        {
          provide: AppConfigService,
          useValue: { availability: { ttlSeconds: 300 } },
        },
      ],
    }).compile();
    service = moduleRef.get(AvailabilityService);
  });

  it("reports offline by default", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    const state = await service.getState(profile());
    expect(state.status).toBe(AvailabilityStatus.Offline);
    expect(state.infrastructure).toBe("ok");
  });

  it("goes online when eligible, with the configured TTL", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    const state = await service.goOnline(profile());
    expect(state.status).toBe(AvailabilityStatus.Available);
    expect(redisClient!._expiries.get("rndm:availability:host:p1")).toBe(300);
  });

  it("rejects going online when not eligible", async () => {
    evaluateHost.mockResolvedValue(eligibility(false));
    await expect(service.goOnline(profile())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("fails closed when Redis is not configured", async () => {
    redisClient = null;
    evaluateHost.mockResolvedValue(eligibility(true));
    await expect(service.goOnline(profile())).rejects.toThrow(
      ServiceUnavailableException,
    );
    const state = await service.getState(profile());
    expect(state.infrastructure).toBe("unconfigured");
  });

  it("heartbeat refreshes TTL for an online eligible host", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    await service.goOnline(profile());
    const state = await service.heartbeat(profile());
    expect(state.status).toBe(AvailabilityStatus.Available);
    expect(redisClient!.expire).toHaveBeenCalledWith(
      "rndm:availability:host:p1",
      300,
    );
  });

  it("heartbeat drops availability if eligibility was revoked", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    await service.goOnline(profile());
    evaluateHost.mockResolvedValue(eligibility(false));
    const state = await service.heartbeat(profile());
    expect(state.status).toBe(AvailabilityStatus.Offline);
    expect(redisClient!._store.has("rndm:availability:host:p1")).toBe(false);
  });

  it("goes offline explicitly", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    await service.goOnline(profile());
    const state = await service.goOffline(profile());
    expect(state.status).toBe(AvailabilityStatus.Offline);
    expect(redisClient!._store.has("rndm:availability:host:p1")).toBe(false);
  });

  it("never exposes ringing/in_call states", async () => {
    evaluateHost.mockResolvedValue(eligibility(true));
    redisClient!._store.set("rndm:availability:host:p1", "in_call");
    const state = await service.getState(profile());
    expect(state.status).toBe(AvailabilityStatus.Offline);
  });
});
