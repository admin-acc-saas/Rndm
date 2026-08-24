import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { AccountStatus, Profile, UserRole } from "@rndm/contracts";
import { RolesGuard } from "../src/common/roles.guard";
import { UsersService } from "../src/users/users.service";
import { REQUIRE_ROLE_KEY } from "../src/common/require-role.decorator";

function profile(role: UserRole | null): Profile {
  return {
    id: "p1",
    supabaseUserId: "u1",
    displayName: "Test",
    role,
    accountStatus: AccountStatus.Active,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

type MockRequest = { user?: { supabaseUserId: string }; profile?: Profile };

function mockContext(request: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let getOrCreateProfile: jest.Mock;
  let requiredRole: UserRole | undefined;

  beforeEach(async () => {
    getOrCreateProfile = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: () => requiredRole,
          },
        },
        {
          provide: UsersService,
          useValue: { getOrCreateProfile },
        },
      ],
    }).compile();
    guard = moduleRef.get(RolesGuard);
  });

  it("allows when no role metadata is set", async () => {
    requiredRole = undefined;
    const ctx = mockContext({ user: { supabaseUserId: "u1" } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("allows a matching server-side role and attaches the profile", async () => {
    requiredRole = UserRole.Host;
    getOrCreateProfile.mockResolvedValue(profile(UserRole.Host));
    const request: MockRequest = { user: { supabaseUserId: "u1" } };
    await expect(guard.canActivate(mockContext(request))).resolves.toBe(true);
    expect(request.profile?.role).toBe(UserRole.Host);
  });

  it("rejects a mismatched role (Caller cannot use Host endpoints)", async () => {
    requiredRole = UserRole.Host;
    getOrCreateProfile.mockResolvedValue(profile(UserRole.Caller));
    const ctx = mockContext({ user: { supabaseUserId: "u1" } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("rejects when no role has been selected yet", async () => {
    requiredRole = UserRole.Host;
    getOrCreateProfile.mockResolvedValue(profile(null));
    const ctx = mockContext({ user: { supabaseUserId: "u1" } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("rejects unauthenticated requests", async () => {
    requiredRole = UserRole.Host;
    const ctx = mockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});

describe("REQUIRE_ROLE_KEY metadata", () => {
  it("uses a namespaced metadata key", () => {
    expect(REQUIRE_ROLE_KEY).toBe("rndm:requireRole");
  });
});
