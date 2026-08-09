import { cache } from "react";
import { draftMode } from "next/headers";

import { isPreviewConfigured } from "./client";

/**
 * Whether this request should read drafts instead of published content.
 *
 * Kept in its own module rather than in `client.ts`: this one imports
 * `next/headers`, and `client.ts` is pulled into the Studio's client bundle by
 * `sanity.config.ts`, where a server-only import is a build error.
 *
 * Wrapped in React `cache()` for the same reason the getters are — every getter
 * asks, and they all share one request.
 *
 * The `try` is load-bearing, not defensive padding. The getters run in two
 * different contexts: rendering a request, where draft mode exists, and
 * `generateStaticParams` at build time, which Next runs with a work store but
 * *no* request store — `draftMode()` throws there rather than reporting "off".
 * An ordinary prerender is the benign case: it reports `false`, and reading
 * `isEnabled` (unlike calling `enable()`) does not opt the route into dynamic
 * rendering, so the catalogue and the product pages stay static.
 */
export const isDraftEnabled = cache(async (): Promise<boolean> => {
  if (!isPreviewConfigured) return false;
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
});
