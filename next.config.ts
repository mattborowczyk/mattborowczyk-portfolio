import type { NextConfig } from "next";

/**
 * `next dev` compiles with eval-based source maps and keeps a websocket open for
 * HMR, both of which a production-grade CSP forbids. The header is built once at
 * config load, so this reads the mode Next itself was started in.
 */
const isDev = process.env.NODE_ENV !== "production";

/**
 * Send the policy as `Content-Security-Policy-Report-Only` instead of enforcing
 * it. Read at build time (Netlify env var, then redeploy), so a policy change
 * can be watched on a deploy preview before it can break anything for a
 * visitor. Anything other than the enforcing header also costs the site its
 * securityheaders.com grade, so this is a rollout switch, not a setting.
 */
const reportOnly = process.env.CSP_REPORT_ONLY === "true";

/**
 * The policy for the public site. The Studio is exempt entirely — see below.
 *
 * Two directives are looser than they look, and neither can be tightened
 * without giving something else up:
 *
 * - `script-src 'unsafe-inline'`: Next inlines the hydration payload (the
 *   `self.__next_f.push(...)` chunks) into every document, and the product page
 *   inlines its JSON-LD. Replacing this with a nonce means generating one per
 *   request from middleware, which makes every route dynamic — the site is
 *   prerendered and means to stay that way (see the performance notes in
 *   CLAUDE.md). Note that browsers ignore `'unsafe-inline'` when a nonce or
 *   hash is present, so this cannot be "hardened" by adding one alongside.
 * - `style-src 'unsafe-inline'`: Next inlines critical CSS, and `style-src-attr`
 *   falls back to this, so every React `style={{…}}` prop depends on it too.
 *
 * The rest is as narrow as the site's actual traffic allows:
 *
 * - `img-src` — `data:` covers Next's image placeholders, `cdn.sanity.io` the
 *   assets that bypass the optimiser (anything animated; see the media notes).
 * - `media-src` — clips play straight off the Sanity CDN for the same reason.
 * - `font-src 'self'` — `next/font` self-hosts Cormorant and Plex Mono at build
 *   time, so nothing is fetched from Google at runtime.
 * - `connect-src` — the published site never talks to Sanity from the browser
 *   (every read is server-side, and the newsletter POST is same-origin), so
 *   `*.sanity.io` is here only for draft mode, which runs Visual Editing on
 *   these same public routes and can't be exercised without the Studio.
 * - `frame-ancestors 'self'` — the Presentation tool previews the site in an
 *   iframe from the Studio at /admin, which is this origin.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io",
  "media-src 'self' https://cdn.sanity.io",
  "font-src 'self'",
  `connect-src 'self' https://*.sanity.io wss://*.sanity.io${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** Safe on every route, Studio included. */
const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  /**
   * Set here rather than in netlify.toml because `[[headers]]` there only
   * decorates static files, and most of this site is rendered.
   *
   * The Studio gets the base headers but no CSP. It is a full application
   * shipped as a dependency: it evaluates code at runtime, builds workers from
   * blob URLs, and talks to a shifting set of Sanity hosts over HTTP and
   * websockets. A policy loose enough for it would be loose enough to be worth
   * little on the public pages, and pinning it to whatever Sanity loads today
   * would make an upgrade break the CMS in ways that only show up in the
   * browser console. So the split is deliberate: the public site is locked
   * down, /admin is left to Sanity — it sits behind Sanity's own auth and
   * serves no untrusted content.
   *
   * The exclusion is anchored to the whole segment (`admin` followed by `/` or
   * the end of the path) rather than a bare prefix. `/((?!admin).*)` would also
   * skip `/administrator` and `/admin-preview`, which are not the Studio — they
   * are 404s, and a 404 is a rendered page that should carry the policy like
   * any other.
   */
  async headers() {
    return [
      {
        source: "/((?!admin(?:/|$)).*)",
        headers: [
          ...baseHeaders,
          {
            key: reportOnly
              ? "Content-Security-Policy-Report-Only"
              : "Content-Security-Policy",
            value: csp,
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
