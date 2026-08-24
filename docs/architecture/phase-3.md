# Phase 3 — Authenticated RNDM Web App

This document describes the Phase 3 implementation: authenticated Caller/Host
onboarding, profiles, the Host application/review lifecycle, eligibility,
availability, and the Redis/BullMQ foundation. It builds on Phase 1
(marketing foundation) and Phase 2 (backend + auth foundation) without
changing the locked architecture.

## Scope delivered

- **Contracts** (`packages/contracts`): Caller/Host profile types, Host
  application/review/audit types, eligibility and availability response
  types, onboarding request/response types. The base `Profile.role` is now
  nullable: a new account has no role until onboarding assigns one.
- **Database** (`backend/api/db/migrations`):
  - `0002_caller_host_profiles.sql` — `caller_profiles`, `host_profiles`,
    `legal_acceptances`; `profiles.role` becomes nullable and a
    `profiles_lock_role` trigger makes role assignment immutable.
  - `0003_host_applications.sql` — `host_applications` (one active
    application per profile via partial unique index) and
    `host_application_events` (append-only audit trail, no UPDATE/DELETE).
- **Backend modules** (`backend/api/src`): `profiles`, `hosts` (application
  lifecycle + admin review endpoints), `onboarding`, `eligibility`,
  `availability`, `redis`, `queue` (BullMQ foundation), plus `common`
  guards/decorators/validation.
- **Web app** (`apps/web`): `/app` is now the real authenticated experience —
  one-time role selection, Caller/Host onboarding forms, Caller home, Host
  home with application status, eligibility-gated availability control and
  self-managed calling rate. Mutations go through the same-origin
  `/app/backend/*` proxy so access tokens never reach client-side JS.

## Locked invariants

1. **Role is chosen once and never changes.** Enforced at three layers:
   `UsersService.assignRoleOnce` (race-safe `.is("role", null)` update), the
   `profiles_lock_role` database trigger, and the `RolesGuard` reading the
   server-side profile — never a client-supplied role.
2. **Host access requires the full eligibility chain.** A Host is eligible
   only when: fixed host role + active account + approved application +
   completed host profile. `EligibilityService` is the single authoritative
   boundary; the future matching service consumes it instead of rebuilding
   rules.
3. **Availability is operational, not durable.** Redis, TTL-based, explicit
   go-online gated by eligibility, heartbeat refresh, explicit offline. Only
   `offline` and `available` exist; `ringing`/`in_call` are reserved for the
   future call architecture and are set exclusively by backend call logic.
4. **Hosts set their own calling rate.** Platform-configured bounds
   (`HOST_RATE_MIN_COINS`/`HOST_RATE_MAX_COINS`) are enforced server-side.
   Admin never sets a Host's rate.
5. **Review is append-only and admin-only.** Application status transitions
   (pending → approved/rejected) happen only through the admin review
   endpoints (ADMIN_EMAILS allowlist + Supabase Auth), are race-safe
   (conditional update on `status = 'pending'`), and every transition is
   written to `host_application_events`.
6. **No scope creep.** No coins/wallet, no payments, no matching, no calls,
   no LiveKit, no notifications, no Admin Dashboard UI, no Flutter. Admin
   endpoints exist at the API/domain level only.

## API surface (Phase 3)

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | none | Liveness + dependency status (database, redis) |
| `GET /auth/me` | bearer | Supabase identity + application profile |
| `GET /onboarding/state` | bearer | Full onboarding state (role, profiles, application, rate bounds) |
| `POST /onboarding/caller` | bearer | One-time Caller onboarding (assigns fixed role) |
| `POST /onboarding/host` | bearer | One-time Host onboarding + application submission |
| `GET /profiles/me` | bearer | Full profile view incl. legal acceptances |
| `PATCH /profiles/me` | bearer | Update display name |
| `PATCH /profiles/me/host` | bearer + Host | Update bio/languages/calling rate |
| `GET /hosts/application` | bearer | Own current Host application |
| `GET /eligibility/me` | bearer | Server-computed Host eligibility result |
| `GET /availability/me` | bearer + Host | Availability + eligibility state |
| `POST /availability/online` | bearer + Host + eligible | Go online (Redis, TTL) |
| `POST /availability/heartbeat` | bearer + Host | Refresh availability TTL |
| `POST /availability/offline` | bearer + Host | Go offline |
| `GET /admin/host-applications` | bearer + admin | List applications (optional `?status=`) |
| `POST /admin/host-applications/:id/approve` | bearer + admin | Approve a pending application |
| `POST /admin/host-applications/:id/reject` | bearer + admin | Reject a pending application (reason required) |

## Redis/BullMQ foundation

- `RedisModule` provides a shared ioredis client from `REDIS_URL`. When
  `REDIS_URL` is unset the API still boots; Redis-backed features report
  `unconfigured` honestly and `/health` reflects it.
- `QueueModule` initializes BullMQ on the same connection. No queues or jobs
  are registered yet — real asynchronous work (notifications, payment
  webhooks, settlement, reconciliation) arrives in later phases.
- Availability keys: `rndm:availability:host:<profileId>` with
  `AVAILABILITY_TTL_SECONDS` expiry.

## Failure modes (fail-closed, no fake states)

- Backend unreachable → `/app` renders a "we'll be right back" state.
- Redis unconfigured → availability control reports infrastructure as
  unconfigured; go-online returns 503.
- Supabase unconfigured → `/app` reports authentication not connected.
- No admin allowlist → admin endpoints reject everyone.

## Deferred to later phases (by design)

Coins/wallet/ledger, Cashfree payments, matching/discovery, LiveKit calls,
notifications, moderation, Admin Dashboard UI, Flutter mobile app.
