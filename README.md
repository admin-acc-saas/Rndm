# RNDM

RNDM is a production-grade real-time voice-social platform that matches
callers with verified hosts for anonymous 1-on-1 voice calls. Callers use a
pay-as-you-go coin balance; hosts set their own calling rate, control
availability, and earn from billable call time.

This repository contains the RNDM monorepo. The authoritative product and
architecture source of truth is
[`docs/RNDM_Production_Master_Specification.docx`](docs/RNDM_Production_Master_Specification.docx).

## Current status

**Phase 1 — foundation + marketing website.**

Implemented:

- pnpm workspace monorepo structure.
- Next.js (App Router, TypeScript, Tailwind) marketing website at `apps/web`.
- Locked visual identity: deep black, orange accent, Zodiak + Plus Jakarta
  Sans typography.
- Self-hosted fonts, images, favicon, OG image (no runtime design-tool/CDN
  dependency).
- Marketing routes: `/`, `/features`, `/how-it-works`, `/hosts`, `/privacy`,
  `/terms`, and an honest `/app` status page.
- SEO baseline: per-page metadata, Open Graph, sitemap, robots, canonical
  URLs.
- Accessible, reduced-motion-aware animations.

Intentionally NOT implemented (future phases):

- NestJS backend / API.
- Supabase / PostgreSQL data model.
- Redis / BullMQ.
- LiveKit voice integration.
- Cashfree payments.
- Authenticated Web App (Caller + Host experiences).
- Admin Dashboard.
- Flutter Android/iOS clients.

## Repository architecture

```
RNDM/
├── apps/web/        # Marketing site + future web app (Next.js)
├── docs/            # Specification, architecture, design reference
├── package.json     # Workspace root
└── pnpm-workspace.yaml
```

See [`docs/architecture/overview.md`](docs/architecture/overview.md) for the
full architecture, decisions, and integration boundaries.

The original marketing design reference is preserved at
[`docs/design/rndm-marketing-reference.html`](docs/design/rndm-marketing-reference.html)
as a design artifact only — it is not part of the runtime.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3**
- **lucide-react** (icons)
- **pnpm** workspaces

## Getting started

### Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)

### Install

```bash
pnpm install
```

### Run the marketing site locally

```bash
pnpm dev
```

The site is served at http://localhost:3000.

### Build

```bash
pnpm build
pnpm start
```

### Lint, typecheck

```bash
pnpm lint
pnpm typecheck
```

## Environment variables

The marketing website has no backend and requires no environment variables.
When the backend phase begins, secrets (Supabase, Redis, LiveKit, Cashfree,
store billing, notifications) will be documented here and handled exclusively
server-side. No secrets should ever be committed to the repository.

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
│   ├── app/                # /app (future web app entry, status page now)
│   ├── sitemap.ts          # /sitemap.xml
│   ├── robots.ts           # /robots.txt
│   └── globals.css         # Design tokens, reveal/parallax/noise CSS
├── components/             # Navbar, Footer, Hero, Features, Experience, …
├── hooks/                  # useReveal, useParallaxScroll, useScrolledNav
└── lib/                    # routes.ts, site.ts (config + SEO helpers)
```

## Where future web-app functionality will live

The authenticated Web App (Caller + Host experiences) and Admin Dashboard will
live inside `apps/web` under the `/app` and `/admin` route groups, sharing the
same design system as the marketing site and consuming the future NestJS
backend at `backend/api`. The Flutter clients will live at `apps/mobile` and
consume the same backend. Shared API/domain contracts will live in
`packages/contracts`.

## Recommended next phase

Per the specification's development sequence, the next logical phase is:

1. Stand up the NestJS backend (`backend/api`) and Supabase project with the
   production-oriented database/auth foundation.
2. Implement authentication and the Caller/Host role model with separate
   onboarding.
3. Begin the authenticated Web App at `/app`, reusing this design system.

This phase is not started automatically.
