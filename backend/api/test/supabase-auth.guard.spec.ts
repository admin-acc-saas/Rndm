import { Test } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SupabaseAuthGuard } from "../src/auth/supabase-auth.guard";
import { SupabaseService } from "../src/supabase/supabase.service";

type MockRequest = {
  headers: { authorization?: string };
  user?: unknown;
};

function mockExecutionContext(request: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe("SupabaseAuthGuard", () => {
  let guard: SupabaseAuthGuard;
  let getUser: jest.Mock;

  beforeEach(async () => {
    getUser = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        {
          provide: SupabaseService,
          useValue: {
            getService: () => ({ auth: { getUser } }),
          },
        },
      ],
    }).compile();
    guard = moduleRef.get(SupabaseAuthGuard);
  });

  it("rejects requests without a bearer token", async () => {
    const ctx = mockExecutionContext({ headers: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects an invalid/expired token", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthInvalidTokenError" },
    });
    const ctx = mockExecutionContext({
      headers: { authorization: "Bearer bad-token" },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("attaches the authenticated user when the token is valid", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "caller@example.com" } },
      error: null,
    });
    const request: MockRequest = {
      headers: { authorization: "Bearer valid-token" },
    };
    const ctx = mockExecutionContext(request);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({
      supabaseUserId: "user-123",
      email: "caller@example.com",
    });
  });

  it("rejects all requests when Supabase is not configured", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        { provide: SupabaseService, useValue: { getService: () => null } },
      ],
    }).compile();
    const unconfiguredGuard = moduleRef.get(SupabaseAuthGuard);
    const ctx = mockExecutionContext({
      headers: { authorization: "Bearer some-token" },
    });
    await expect(unconfiguredGuard.canActivate(ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
