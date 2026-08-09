import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { isPreviewConfigured, previewClient } from "@/sanity/lib/client";

/**
 * Turns Next.js draft mode on, so the getters in `sanity/lib/fetch-data.ts`
 * start reading unpublished edits. Paired with `/api/draft/disable`.
 *
 * There is no shared secret of our own to configure or leak. The Presentation
 * tool in the Studio writes a single-use `sanity.previewUrlSecret` document,
 * appends it to this URL and `defineEnableDraftMode` validates it against the
 * dataset before setting the cookie — which is why this needs an authenticated
 * client rather than the public CDN one. Without `SANITY_API_TOKEN` the
 * validation can't read that document and every request here is a 401, which is
 * the correct answer: no token, no preview.
 *
 * `force-dynamic` because this route exists to write cookies — there is nothing
 * here Next could usefully cache, and a cached 401 would be a trap.
 */
export const dynamic = "force-dynamic";

const enableDraftMode = defineEnableDraftMode({ client: previewClient });

export async function GET(request: Request) {
  // Checked before delegating, rather than left to fail on its own: given a
  // tokenless client `validatePreviewUrl` throws a bare `TypeError`, which Next
  // turns into an empty 500. "Preview isn't configured here" is not a server
  // fault and shouldn't look like one — a deployment with no token (CI, a fork,
  // the seed-only build) is a supported state, same as having no Sanity at all.
  if (!isPreviewConfigured) {
    return new Response(
      "Draft preview is not configured — SANITY_API_TOKEN is not set.",
      { status: 401 },
    );
  }
  return enableDraftMode.GET(request);
}
