/**
 * Centralized route map for RNDM.
 *
 * Marketing CTAs route users into the future authenticated Web App via the
 * `/app` entry point. That route is intentionally an honest status page for
 * now and will be replaced by the real Web App once authentication and the
 * NestJS backend are implemented in a later phase.
 *
 * The Admin Dashboard will live under `/admin` and is not linked from the
 * public marketing site (per spec: admin must not be reachable from normal
 * marketing navigation).
 */
export const routes = {
  // Marketing
  home: "/",
  howItWorks: "/how-it-works",
  features: "/features",
  hosts: "/hosts",
  privacy: "/privacy",
  terms: "/terms",

  // Future Web App entry (currently an honest status page)
  app: "/app",

  // Future auth entry points (not yet implemented)
  login: "/login",
  register: "/register",

  // Admin (not linked publicly)
  admin: "/admin",
} as const;

export type Route = (typeof routes)[keyof typeof routes];
