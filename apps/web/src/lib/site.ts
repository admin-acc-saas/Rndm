import type { Metadata } from "next";
import { routes } from "./routes";

export const siteConfig = {
  name: "RNDM",
  tagline: "Meaningful Voice Connections",
  description:
    "RNDM is a voice-social platform that matches callers with verified hosts for one-to-one voice conversations. Real-time audio connections, made simple.",
  url: "https://rndm.app",
  // Update to the production domain before launch. Used for canonical/OG URLs.
  locale: "en",
} as const;

type PageMetaInput = {
  title?: string;
  description?: string;
  path?: string;
};

/**
 * Build per-page metadata with sensible SEO defaults, Open Graph and Twitter
 * cards, canonical URL and a noindex escape hatch for non-production routes.
 */
export function pageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
}: PageMetaInput = {}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

/** Navigation items rendered in the public marketing header. */
export const navItems: { label: string; href: string }[] = [
  { label: "Features", href: routes.features },
  { label: "How it Works", href: routes.howItWorks },
  { label: "Become a Host", href: routes.hosts },
];

/** Footer link groups (legal + social placeholders). */
export const footerLinks = {
  legal: [
    { label: "Privacy", href: routes.privacy },
    { label: "Terms", href: routes.terms },
  ],
  social: [
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
  ],
} as const;
