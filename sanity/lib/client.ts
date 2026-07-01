import { createClient, type QueryParams } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

/**
 * Whether Sanity is wired up. When false the site renders entirely from the
 * local seed (lib/*), so it keeps working with no project / no .env.local.
 */
export const isSanityConfigured = Boolean(projectId && dataset);

export const client = createClient({
  projectId: projectId ?? "placeholder",
  dataset: dataset ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true, // Set to false for authenticated/draft requests
});

/**
 * Typed fetch helper — wraps client.fetch with proper caching.
 *
 * `revalidate` and `tags` coexist: the response is cached for `revalidate`
 * seconds AND tagged so a webhook can `revalidateTag()` on publish. Pass
 * `revalidate: false` explicitly for tag-only (webhook-driven) invalidation.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}): Promise<T> {
  return client.fetch<T>(query, params, {
    next: { revalidate, tags },
  });
}
