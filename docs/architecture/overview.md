# RNDM Architecture

This document describes the architecture of the RNDM repository, the
decisions made in this first implementation phase, and the integration
boundaries for future phases. It is derived from the RNDM Production Master
Specification (see `docs/RNDM_Production_Master_Specification.docx`), which is
the authoritative source of truth for product and architecture decisions.

## System overview

RNDM is a production-grade real-time voice-social platform with two end-user
roles (Caller and Host), an Admin Dashboard, and a future Flutter mobile
client. The locked target architecture is:

```
Clients
  ├── RNDM Web (Caller + Host + Admin)   ← this repo: apps/web
  └── Flutter Android/iOS (Caller + Host) ← future: apps/mobile
             │
             ▼
        NestJS API                          ← future: backend/api
             │
    ┌────────┼─────────────┐
    ▼        ▼             ▼
 Supabase   Redis/BullMQ   LiveKit
 Postgres   async/fast     voice
 Auth       state/jobs
    │
    └───────────────┐
                    ▼
             Payment Providers
        Cashfree / Play Billing / Apple IAP
```

## Repository layout

```
RNDM/
├── apps/
│   └── web/                 # Next.js marketing site + future web app + admin
│       ├── src/
│       │   ├── app/         # App Router pages & routes
│       │   ├── components/  # Reusable UI components
│       │   ├── hooks/       # Client hooks (reveal, parallax, nav)
│       │   └── lib/         # Route map, site config, SEO helpers
│       └── public/          # Self-hosted fonts, images, favicon, og
├── docs/
│   ├── architecture/        # This document
│   ├── design/              # Marketing design reference HTML (NOT runtime)
│   └── RNDM_Production_Master_Specification.docx
├── package.json             # Workspace root
└── pnpm-workspace.yaml
```

Reserved (not yet created) directories that the spec mandates for later
phases:

- `apps/admin/` — may instead live as an `/admin` route inside `apps/web`
  (the spec permits either; the route is reserved here).
- `apps/mobile/` — Flutter Caller/Host clients.
- `backend/api/` — NestJS backend.
- `packages/contracts/` — shared API/domain contracts (web + backend).
- `packages/config/` — non-secret shared configuration.
- `infrastructure/deployment/` — deployment configuration.

These are intentionally absent. Per the specification and the phase brief,
backend, database, mobile and admin functionality are NOT implemented in this
phase. Creating empty placeholder packages would imply a structure that has
not been validated against the real backend design, so they will be added when
the corresponding phase begins.

## What is implemented in this phase

- **Marketing website** at `apps/web` (Next.js App Router, TypeScript,
  Tailwind). This is the public-facing surface.
- **Design system** matching the locked visual identity: deep black
  (`#050505`), orange accent (`#FF4500`), Zodiak serif display + Plus Jakarta
  Sans body.
- **Self-hosted assets**: fonts (Zodiak woff2, Plus Jakarta Sans via
  `next/font`), atmosphere images, locally-generated noise overlay, favicon,
  OG image. No runtime dependency on the design tool or fragile external
  CDNs.
- **SEO baseline**: per-page metadata, Open Graph, sitemap, robots, canonical
  URLs, semantic HTML.
- **Routes** justified by the current phase (see below).

## Marketing routes

| Route            | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `/`              | Homepage (hero, features, experience, CTA)       |
| `/features`      | Feature detail                                    |
| `/how-it-works`  | End-to-end flow explanation                       |
| `/hosts`         | Become-a-host information                         |
| `/privacy`       | Privacy policy (draft placeholder)               |
| `/terms`         | Terms of service (draft placeholder)             |
| `/app`           | Honest status page — future web app entry        |

Future routes reserved in `src/lib/routes.ts` but not yet implemented:

- `/login`, `/register` — authentication entry points (require backend).
- `/admin` — Admin Dashboard (not linked from marketing nav).

CTAs that lead into the product (`Call Now`, `Start Instant Match`, `Open
RNDM App`) route to `/app`. When the Web App is built, `/app` becomes the
authenticated application shell and these CTAs connect naturally without
changing the marketing navigation.

## Technology choices

- **Next.js (App Router)** — chosen because the marketing site needs SSR/SEO,
  the future web app shares the same design system, and the App Router allows
  marketing, `/app` and `/admin` to coexist in one app with clean route
  boundaries. This matches the spec's note that admin may be "a route/app
  within web".
- **TypeScript** — type safety across the web app and future shared contracts.
- **Tailwind CSS** — design-token-driven styling that mirrors the reference
  and is trivially shareable with the future web app.
- **lucide-react** — replaces the reference's runtime Iconify CDN with
  tree-shakeable React icon components.
- **pnpm workspaces** — monorepo foundation for `apps/*` and future
  `packages/*` and `backend/*`.

No backend, database, auth, payments, voice, or queue infrastructure is
present in this phase. That is intentional.

## Asset handling

The reference HTML depended on several fragile external URLs:

- `framerusercontent.com` atmosphere + floating images → downloaded and
  stored in `apps/web/public/atmosphere/`.
- `grainy-gradients.vercel.app/noise.svg` → replaced with a locally generated
  `public/noise.svg` (SVG turbulence).
- Google Fonts `Zodiak` → Zodiak is NOT on Google Fonts (the reference's URL
  404s). It is sourced from Fontshare (Indian Type Foundry, free license) and
  self-hosted as woff2 in `public/fonts/`.
- Plus Jakarta Sans → served via `next/font/google` (self-hosted at build
  time, no runtime Google Fonts request).
- Iconify CDN → replaced with `lucide-react`.

## Placeholder / dynamic data

The reference displayed fake operational data ("2,481 Hosts Online" with a
green pulse). Per the specification's placeholder-data rule this has been
removed — it is not backed by a real service and would misrepresent the
product. The live local clock is retained because it is genuinely the
visitor's clock, not a fabricated metric. "Global Voice Node" was reworded to
"Global Voice Platform" (a brand label, not a live claim).

## Security

No secrets, API keys, database credentials, or provider tokens exist in this
repository. The marketing site is fully static/client-rendered with no
backend, so no credentials are required. When the backend phase begins,
secrets will be handled exclusively through environment variables and the
server-side NestJS layer — never committed, never shipped to the frontend.

## Animation & accessibility

- Reveal-on-scroll uses a single shared `IntersectionObserver` (per-element
  unobserve after first reveal).
- Parallax uses one `requestAnimationFrame`-throttled scroll listener that
  writes only CSS custom properties.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- The hero content remains readable above the decorative floating images.

## Next phase

Per the spec's development sequence, the next phase is the production Web App
and Admin Dashboard backed by the NestJS API, Supabase/PostgreSQL, Redis/BullMQ
and LiveKit. This phase does not begin automatically — see the README for the
recommended next steps.
