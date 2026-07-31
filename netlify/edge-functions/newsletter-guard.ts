import type { Config } from "@netlify/edge-functions";

/**
 * Rate limit for the newsletter signup endpoint.
 *
 * The function body is intentionally empty: an edge function that returns
 * nothing continues the request chain, so this passes straight through to the
 * Next.js route handler. It exists only to carry the `rateLimit` config below,
 * which Netlify enforces *before* invoking any code — so requests over the
 * limit cost no compute at all.
 *
 * Why this rather than a Redis-backed limiter in the handler:
 *   - no external store, no account, no per-request command budget to blow
 *     through, and nothing to fail open or closed when a third party wobbles;
 *   - `path` scopes it to exactly one endpoint. Deliberately NOT middleware:
 *     an unmatched middleware would run on every page, image and
 *     /_next/static asset, which is how a quiet site racks up a huge bill.
 *
 * The trade-off is the window ceiling. Netlify caps `windowSize` at 180
 * seconds, so this is burst protection, not an hourly quota — a patient
 * attacker on a single IP can still manage ~1,440/day. That is an accepted
 * limit of the mechanism, not an oversight.
 */
const passThrough = async () => {
  // Empty return → continue to the Next.js handler.
};

export default passThrough;

export const config: Config = {
  path: "/api/newsletter",
  rateLimit: {
    action: "rate_limit",
    // A real signup is one request; three leaves room for a typo and a retry.
    windowLimit: 3,
    windowSize: 180,
    // Buckets per IP *per domain*, so preview deploys don't consume the
    // production allowance (and vice versa).
    aggregateBy: ["ip", "domain"],
  },
};
