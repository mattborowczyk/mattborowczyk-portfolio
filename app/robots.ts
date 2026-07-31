import type { MetadataRoute } from "next";

import { getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60;

const BASE_URL = "https://mattborowczyk.com";

/**
 * `/admin` (Studio) and `/links` (bio hub) are kept out of the index in every
 * case; while coming-soon mode is on, so is everything else.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();

  if (settings.maintenance.enabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/links"] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
