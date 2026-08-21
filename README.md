# RNDM

RNDM is a production-grade real-time voice-social platform that matches
callers with verified hosts for anonymous 1-on-1 voice calls. Callers use a
pay-as-you-go coin balance; hosts set their own calling rate, control
availability, and earn from billable call time.

This repository contains the RNDM monorepo. The authoritative product and
architecture source of truth is
[`docs/RNDM_Production_Master_Specification.docx`](docs/RNDM_Production_Master_Specification.docx).

## Current status

**Phase 2 — backend, auth, and caller/host foundation (in progress, on a
feature branch).**

Phase 1 (foundation + marketing website) is merged to `main`.

Phase 2 implemented:

- **NestJS backend** at `backend/api` (modular: config, supabase, roles,
  users, auth, health, common). Endpoints live at the root namespace
  (`/health`, `/auth/me`) to match the specification — no `/api/v1` prefix.
- **Supabase integration**: a `SupabaseModule` exposing a server-side
  service-role client (RLS-bypassing, never shipped to the browser) and an
  anon client. When credentials are absent the service degrades to an honest
  "unconfigured" state rather than crashing.
- **Authentication**: a self-contained `SupabaseAuthGuard` (no Passport) that
  validates the caller's Supabase access token via `auth.getUser()` and
  attaches a typed `CurrentUser`. `GET /auth/me` returns the Supabase
  identity plus the application profile.
- **Caller/Host role model** (`packages/contracts` + `roles`/`users` modules):
  `UserRole` (caller / host, chosen at onboarding, not freely switchable) and
  `AccountStatus` (active / pending / suspended). Host requires an
  application/review flow (`pending → approved`).
- **Database foundation**: `db/migrations/0001_profiles_foundation.sql` —
  `profiles` table, `user_role` / `account_status` enums, indexes, and
  row-level-security policies aligned with the spec.
- **Typed, validated config**: `AppConfigService` with fail-fast env
  validation (no zod). Wildcard CORS is rejected in production.
- **Frontend auth boundary**: `/app` is now a real gateway — a Server
  Component that reads the Supabase session from cookies and renders a
  sign-in CTA when unauthenticated, or the resolved profile (via
  `/auth/me`) when authenticated. `/login` offers passwordless email
  (magic-link) sign-in; `/auth/callback` exchanges the code; `/logout`
  clears the session. Middleware refreshes the session cookie on every
  request. All degrade gracefully when Supabase env vars are not set.
- **Shared contracts package** `@rndm/contracts` (compiled to CJS + types)
  consumed by both the web app and the backend.
- Backend unit tests (health, auth guard, auth controller) — 9 passing.

Intentionally NOT implemented (future phases):

- The full authenticated Web App (Caller + Host experiences) beyond the
  `/app` gateway.
- LiveKit Cloud realtime voice.
- Redis / BullMQ queues.
- Cashfree payments and coin billing.
- Host application/review admin tooling.
- Admin Dashboard.
- Flutter Android/iOS clients.

## Repository architecture

```
RNDM/
├── apps/
│   └── web/            # Marketing site + web app (Next.js, App Router)
├── backend/
│   └── api/            # NestJS backend API
│       ├── src/        # config, supabase, roles, users, auth, health, common
│       └── db/migrations/  # Supabase PostgreSQL migrations
├── packages/
│   └── contracts/      # Shared API/domain types (web + backend + future Flutter)
├── docs/               # Specification, architecture, design reference
├── package.json        # Workspace root
└── pnpm-workspace.yaml
```

See [`docs/architecture/overview.md`](docs/architecture/overview.md) for the
full architecture, decisions, and integration boundaries.

The original marketing design reference is preserved at
[`docs/design/rndm-marketing-reference.html`](docs/design/rndm-marketing-reference.html)
as a design artifact only — it is not part of the runtime.

## Tech stack

- **Web**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 3
- **Backend**: NestJS 10 + TypeScript
- **Database / Auth**: Supabase (PostgreSQL + Auth, JWT validated by the API)
- **Shared contracts**: `@rndm/contracts` (compiled CJS + `.d.ts`)
- **Tooling**: pnpm workspaces, ESLint 9, Jest (backend)
- **Future**: LiveKit Cloud (voice), Redis/BullMQ (queues), Cashfree
  (payments), Flutter (mobile)

## Getting started

### Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)

### Install

```bash
pnpm install
```

The `@rndm/contracts` package compiles automatically as a `prebuild` step of
the web and API builds, and via its own `prepare` script on install.

### Run the marketing site locally

```bash
pnpm dev:web
```

The site is served at http://localhost:3000. Without Supabase env vars the
`/app` gateway renders an honest "not configured" status page and `/login`
reports that authentication is not connected.

### Run the backend locally

```bash
pnpm dev:api
```

The API is served at http://localhost:3001. Without Supabase env vars it
boots in a degraded state: `/health` reports `database: "unconfigured"` and
`/auth/me` rejects requests (the guard requires a valid Supabase token).

`/health` and `/auth/me` are at the root namespace (no `/api/v1` prefix),
matching the specification.

### Build

```bash
pnpm build        # contracts → web → api
pnpm build:web    # web only
pnpm build:api    # api only (incl. contracts)
```

### Lint, typecheck, test

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values. The backend reads
server-side secrets; the web app reads only `NEXT_PUBLIC_*` values. No
secrets should ever be committed.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NODE_ENV` | api | runtime environment |
| `PORT` | api | backend port (default 3001) |
| `API_BASE_URL` | api | canonical backend URL |
| `WEB_APP_URL` | api | web origin (canonical) |
| `CORS_ORIGINS` | api | comma-separated allowed origins; `*` rejected in production |
| `SUPABASE_URL` | api | Supabase project URL |
| `SUPABASE_ANON_KEY` | api | anon/public key (RLS-respecting) |
| `SUPABASE_SERVICE_ROLE_KEY` | api | **server-side only**, never shipped to the browser |
| `NEXT_PUBLIC_API_URL` | web | backend URL the browser uses |
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase project URL (client auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | anon key (safe to expose) |

Future secrets (LiveKit, Redis, Cashfree, notifications) will be added
server-side only when their phases land.

## Marketing site structure

```
apps/web/src/
├── app/
│   ├── layout.tsx          # Root layout: fonts, metadata, viewport
│   ├── page.tsx            # Home
│   ├── features/           # /features
│   ├── how-it-works/       # /how-it-works
│   ├── hosts/              # /hosts
│   ├── privacy/            # /privacy
│   ├── terms/              # /terms
│   ├── login/              # /login (passwordless email sign-in)
│   ├── auth/callback/      # /auth/callback (magic-link code exchange)
│   ├── logout/             # /logout (POST route handler)
│   ├── app/                # /app (auth gateway / future web app)
│   ├── sitemap.ts          # /sitemap.xml
│   ├── robots.ts           # /robots.txt
│   └── globals.css         # Design tokens, reveal/parallax/noise CSS
├── components/             # Navbar, Footer, Hero, Features, Experience, …
│   ├── auth/               # LoginForm
│   └── app/                # AppGateway (auth boundary)
├── hooks/                  # useReveal, useParallaxScroll, useScrolledNav
├── lib/
│   ├── routes.ts           # Central route table
│   ├── site.ts             # Config + SEO helpers
│   ├── api/client.ts       # Typed backend client (health, /auth/me)
│   └── supabase/           # Browser + server Supabase clients (@supabase/ssr)
└── middleware.ts           # Refreshes Supabase session cookie per request
```

## Backend structure

```
backend/api/src/
├── config/        # AppConfigService + fail-fast env validation
├── supabase/      # SupabaseModule (service-role + anon clients)
├── roles/         # Caller/Host role model
├── users/         # Profile load/create
├── auth/          # SupabaseAuthGuard, CurrentUser, /auth/me
├── health/        # /health (honest dependency status)
├── common/        # GlobalExceptionFilter
├── app.module.ts
└── main.ts        # CORS, global filter, bootstrap
backend/api/db/migrations/
└── 0001_profiles_foundation.sql   # profiles, enums, indexes, RLS
```

## Where future web-app functionality will live

The authenticated Web App (Caller + Host experiences) and Admin Dashboard will
live inside `apps/web` under the `/app` and `/admin` route groups, sharing the
same design system and consuming the NestJS backend at `backend/api`. The
Flutter clients will live at `apps/mobile` and consume the same backend and
`@rndm/contracts`. Backend realtime/billing/queue integrations (LiveKit,
Cashfree, Redis/BullMQ) will be added as NestJS modules.

## Recommended next phase

Phase 2 establishes the backend, auth, and caller/host foundation. The next
logical phase, per the specification's development sequence, is:

1. Host application/review flow (status transitions `pending → approved`,
   admin tooling) and caller onboarding within `/app`.
2. LiveKit Cloud integration: token issuance and the realtime voice session.
3. Coin billing: Cashfree payments → coin balance → billable call time.

This phase is not started automatically.
