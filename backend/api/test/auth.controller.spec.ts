import { Test } from "@nestjs/testing";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { SupabaseService } from "../src/supabase/supabase.service";

describe("AuthController", () => {
  let controller: AuthController;
  let getMe: jest.Mock;

  beforeEach(async () => {
    getMe = jest.fn();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { getMe } },
        // The controller applies SupabaseAuthGuard, which injects
        // SupabaseService. Provide a stub so the guard can be instantiated.
        { provide: SupabaseService, useValue: { getService: () => null } },
      ],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  it("returns the authenticated identity and profile from the service", async () => {
    getMe.mockResolvedValue({
      supabaseUserId: "user-123",
      email: "caller@example.com",
      profile: null,
    });
    const result = await controller.getMe({
      supabaseUserId: "user-123",
      email: "caller@example.com",
    });
    expect(getMe).toHaveBeenCalledWith({
      supabaseUserId: "user-123",
      email: "caller@example.com",
    });
    expect(result.supabaseUserId).toBe("user-123");
    expect(result.profile).toBeNull();
  });

  it("does not expose internal database details", async () => {
    getMe.mockResolvedValue({
      supabaseUserId: "user-123",
      email: null,
      profile: null,
    });
    const result = await controller.getMe({
      supabaseUserId: "user-123",
      email: null,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("connection");
  });
});
