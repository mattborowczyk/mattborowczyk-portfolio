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
 *
 * `||`, not `??`: a var that is *set but blank* has to fall back too. An empty
 * `NEXT_PUBLIC_SANITY_PROJECT_ID=` line, or a Netlify variable cleared in the
 * UI, is not null — under `??` it survived as `""` and `createClient` threw
 * "Configuration must contain `projectId`" at module load, failing the whole
 * build while collecting page data. That is precisely the opaque crash these
 * placeholders exist to prevent, and it disagreed with `isSanityConfigured`
 * above, which already treats blank as unconfigured.
 */
export const projectId = envProjectId || "placeholder";
export const dataset = envDataset || "production";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true, // Set to false for authenticated/draft requests
});

/**
 * Whether draft preview is available. A read token is the whole difference
 * between "can see what is published" and "can see what an editor has typed but
 * not published yet", so without one there is simply no preview and every
 * request stays on the published path — same spirit as `isSanityConfigured`.
 *
 * Deliberately not `NEXT_PUBLIC_`: it is read here, in a module the Studio also
 * imports, but Next only inlines `NEXT_PUBLIC_*` into client bundles, so at
 * /admin this resolves to `undefined` and the token never leaves the server.
 */
const previewToken = process.env.SANITY_API_TOKEN;

export const isPreviewConfigured = isSanityConfigured && Boolean(previewToken);

/**
 * The client used *only* while Next.js draft mode is on.
 *
 * - `perspective: "drafts"` returns a document's draft where one exists and the
 *   published version otherwise — exactly what an editor expects a preview to
 *   show. Set together with `useCdn: false`, because the CDN only ever serves
 *   published content (the client forces this off anyway, with a warning).
 * - `stega: false`, so this stays *draft preview* and not visual editing. Stega
 *   enables click-to-edit by hiding invisible marker characters inside every
 *   string it returns, and this site compares CMS strings for equality all over
 *   — the category filter, `actionType` on link items, the pricing tab keys.
 *   Those comparisons would quietly stop matching in preview only. Turning it
 *   on means auditing every one of them first (see `stegaClean`).
 */
export const previewClient = client.withConfig({
  useCdn: false,
  token: previewToken,
  perspective: "drafts",
  stega: false,
});

/**
 * Typed fetch helper — wraps client.fetch with proper caching.
 *
 * `revalidate` and `tags` coexist: the response is cached for `revalidate`
 * seconds AND tagged so a webhook can `revalidateTag()` on publish. Pass
 * `revalidate: false` explicitly for tag-only (webhook-driven) invalidation.
 *
 * `draft` swaps in the authenticated preview client and drops the caching
 * entirely. Callers don't decide this themselves — `cmsFetch` in fetch-data.ts
 * answers it once per request. Note this takes the *decision*, not the reading
 * of it: `draftMode()` is a request-scoped API and this module is bundled into
 * the Studio, which has no request to scope to.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
  draft = false,
}: {
  query: string;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
  draft?: boolean;
}): Promise<T> {
  if (draft) {
    // No ISR window and no tags: the point of a preview is to show the edit
    // made a second ago, and a tag can only be invalidated on *publish* — which
    // is the one thing a draft has not done. Next already bypasses the route
    // cache while the draft cookie is set; this makes the data layer agree.
    return previewClient.fetch<T>(query, params, { cache: "no-store" });
  }
  return client.fetch<T>(query, params, {
    next: { revalidate, tags },
  });
}
