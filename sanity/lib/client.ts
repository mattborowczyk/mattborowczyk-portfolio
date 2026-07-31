import { createClient, type QueryParams } from "next-sanity";

const envProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

/**
 * Whether Sanity is wired up. When false the site renders entirely from the
 * local seed (lib/*), so it keeps working with no project / no .env.local.
 */
export const isSanityConfigured = Boolean(envProjectId && envDataset);

/**
 * Resolved connection details, placeholders included. Exported so the Studio
 * config uses exactly the same values as the site rather than asserting the
 * env vars are set — the whole codebase is built to run without them, and a
 * non-null assertion there just turned a missing var into an opaque crash.
 */
export const projectId = envProjectId ?? "placeholder";
export const dataset = envDataset ?? "production";

export const client = createClient({
  projectId,
  dataset,
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
