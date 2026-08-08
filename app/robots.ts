import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/site";
import { getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60;

/**
 * Only `/admin` is disallowed here, and only because nothing links to it: a
 * crawler can't discover it, and there is no point spending crawl budget on a
 * 1.6 MB Studio bundle.
 *
 * `/links` is deliberately *not* disallowed even though it must stay out of the
 * index. It is the link in an Instagram bio, so it is discovered externally
 * whatever robots.txt says — and a disallowed URL is one the crawler may never
 * fetch, which means it never reads the `noindex` on the page and is free to
 * list the bare URL. Letting it crawl is what makes the noindex bind. Same
 * reason `/product/*` stays open: the sitemap advertises it.
 *
 * While coming-soon mode is on, everything is disallowed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();

  if (settings.maintenance.enabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
