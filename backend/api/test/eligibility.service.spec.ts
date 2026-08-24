import { Test } from "@nestjs/testing";
import {
  AccountStatus,
  CallerProfile,
  HostApplication,
  HostApplicationStatus,
  HostProfile,
  Profile,
  UserRole,
} from "@rndm/contracts";
import { EligibilityService } from "../src/eligibility/eligibility.service";
import { ProfilesService } from "../src/profiles/profiles.service";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    supabaseUserId: "u1",
    displayName: "Test",
    role: UserRole.Host,
    accountStatus: AccountStatus.Active,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function application(status: HostApplicationStatus): HostApplication {
  return {
    id: "a1",
    profileId: "p1",
    status,
    dateOfBirth: "1995-04-12",
    languages: ["English"],
    bio: "Hello world, this is my host bio.",
    payoutDetails: {},
    submittedAt: "2026-01-01T00:00:00Z",
    reviewedAt: null,
    reviewedByProfileId: null,
    rejectionReason: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function hostProfile(complete: boolean): HostProfile {
  return {
    id: "h1",
    profileId: "p1",
    bio: complete ? "A real bio" : null,
    languages: complete ? ["English"] : [],
    ratePerMinute: null,
    profileCompletedAt: complete ? "2026-01-01T00:00:00Z" : null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

const callerProfile: CallerProfile = {
  id: "c1",
  profileId: "p1",
  dateOfBirth: null,
  gender: null,
  onboardingCompletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("EligibilityService", () => {
  let service: EligibilityService;
  let getLatestHostApplication: jest.Mock;
  let getHostProfile: jest.Mock;

  beforeEach(async () => {
    getLatestHostApplication = jest.fn();
    getHostProfile = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        EligibilityService,
        {
          provide: ProfilesService,
          useValue: { getLatestHostApplication, getHostProfile },
        },
      ],
    }).compile();
    service = moduleRef.get(EligibilityService);
  });

  it("is eligible when role, account, application and profile all pass", async () => {
    getLatestHostApplication.mockResolvedValue(
      application(HostApplicationStatus.Approved),
    );
    getHostProfile.mockResolvedValue(hostProfile(true));
    const result = await service.evaluateHost(profile());
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("is not eligible without the host role", async () => {
    getLatestHostApplication.mockResolvedValue(
      application(HostApplicationStatus.Approved),
    );
    getHostProfile.mockResolvedValue(hostProfile(true));
    const result = await service.evaluateHost(
      profile({ role: UserRole.Caller }),
    );
    expect(result.eligible).toBe(false);
    expect(result.checks.roleIsHost).toBe(false);
  });

  it("is not eligible with a pending application", async () => {
    getLatestHostApplication.mockResolvedValue(
      application(HostApplicationStatus.Pending),
    );
    getHostProfile.mockResolvedValue(hostProfile(true));
    const result = await service.evaluateHost(profile());
    expect(result.eligible).toBe(false);
    expect(result.checks.applicationApproved).toBe(false);
  });

  it("is not eligible with no application", async () => {
    getLatestHostApplication.mockResolvedValue(null);
    getHostProfile.mockResolvedValue(hostProfile(true));
    const result = await service.evaluateHost(profile());
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("No Host application submitted");
  });

  it("is not eligible with a suspended account", async () => {
    getLatestHostApplication.mockResolvedValue(
      application(HostApplicationStatus.Approved),
    );
    getHostProfile.mockResolvedValue(hostProfile(true));
    const result = await service.evaluateHost(
      profile({ accountStatus: AccountStatus.Suspended }),
    );
    expect(result.eligible).toBe(false);
    expect(result.checks.accountActive).toBe(false);
  });

  it("is not eligible with an incomplete host profile", async () => {
    getLatestHostApplication.mockResolvedValue(
      application(HostApplicationStatus.Approved),
    );
    getHostProfile.mockResolvedValue(hostProfile(false));
    const result = await service.evaluateHost(profile());
    expect(result.eligible).toBe(false);
    expect(result.checks.hostProfileComplete).toBe(false);
  });

  void callerProfile;
});
