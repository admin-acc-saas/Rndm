import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { routes } from "@/lib/routes";

/**
 * Sitemap for the public marketing surface. The `/app` entry is excluded
 * because it is a non-indexed status page. Future routes are added here as
 * they ship.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const publicRoutes = [
    routes.home,
    routes.features,
    routes.howItWorks,
    routes.hosts,
    routes.privacy,
    routes.terms,
  ];

  return publicRoutes.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
