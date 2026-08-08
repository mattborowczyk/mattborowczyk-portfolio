import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/site";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60;

/**
 * Static routes plus a live entry per piece. `/links` is deliberately absent —
 * it is noindex (see its metadata) and exists only as a bio link.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();

  // Nothing is discoverable while the curtain is down.
  if (settings.maintenance.enabled) return [];

  const products = await getProducts();

  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/course`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.8 },
    ...products.map((p) => ({
      url: `${BASE_URL}/product/${encodeURIComponent(p.ref)}`,
      lastModified: p.made ? new Date(p.made) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
