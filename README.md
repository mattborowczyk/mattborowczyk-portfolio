# mattborowczyk — studio site + course landing + CMS

Editorial portfolio for **Matt Borowczyk**, a studio making hand-made silver &
gold jewellery and objects (signet rings, lighter cases, belt buckles, napkin
rings, pendants). It's an editorial **catalogue** (not a shop — every "buy" is a
`mailto:` commission enquiry), plus a two-course landing page, a Contact page
that absorbs the commission flow, and a hidden bio-links page. A Studio/about
page is built but currently unrouted (see below). Content is editable in an
embedded **Sanity Studio** at `/admin`, and the site falls back to a local seed
so it renders with or without a connected CMS.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — SSG/ISR
- **Tailwind CSS 3** — the *interface* to the design system; the token values
  themselves are CSS custom properties in `app/globals.css` (bone/champagne,
  sage, ink, gold; `nav` breakpoint = 860px). Square corners, hairline borders,
  Cormorant Garamond / IBM Plex Mono / Helvetica.
- **Sanity v3** — embedded Studio at `/admin`
- **MailerLite** — newsletter subscribe (`/api/newsletter`)
- **Netlify** — hosting, plus one edge function that rate-limits the newsletter
  endpoint before any function is invoked
- Planned: **Easytools** (course checkout), **Shopify** (shop)

## Local development

pnpm (pinned via `packageManager` in `package.json`), Node 22 — the same
versions CI and Netlify build with.

```bash
pnpm install
pnpm dev              # http://localhost:3000  (Studio at /admin)
pnpm dev:netlify      # netlify dev — the only way to exercise the edge rate limit
pnpm build            # production build — stop `next dev` first (it clobbers .next)
pnpm lint             # eslint (pnpm lint:fix to autofix)
pnpm exec tsc --noEmit   # typecheck — this, not eslint, is what guards types
```

The site runs **with no configuration**: when Sanity env vars are absent it
serves the local seed in `lib/*`. Add a `.env.local` (see `.env.local.example`)
to connect a real Sanity project and MailerLite.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → build on every PR and
push to `main`, deliberately **without** Sanity secrets: the build then exercises
the local-seed fallback, which is the same path that keeps production up if the
CMS is unreachable. There is no test suite.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for CMS | Sanity project. Without it (or the dataset) the site renders entirely from the local seed. |
| `NEXT_PUBLIC_SANITY_DATASET` | for CMS | Sanity dataset (e.g. `production`). |
| `SANITY_API_TOKEN` | for preview | Viewer token. Enables [draft preview](#draft-preview); without it the site only ever serves published content. |
| `MAILERLITE_API_KEY` | for newsletter | MailerLite API key. |
| `MAILERLITE_GROUP_ID` | no | Group/segment subscribers are added to. |

Rate limiting needs no configuration and no credentials — see
[Newsletter](#newsletter) below.

## Information architecture

| Route | Page | Source |
| --- | --- | --- |
| `/` | Catalogue — editorial run, filtered by `?filter=` | `product` |
| `/product/[ref]` | Product — full-bleed media, spec sheet, commission CTA | `product` |
| `/course` | Course landing — two courses behind a toggle | `course` |
| `/contact` | Contact + commission explainer (steps + pricing tabs) | `contact` singleton |
| `/links` | Hidden bio-link hub — not in nav, `noindex` | `links` singleton |
| `/admin` | Embedded Sanity Studio (the CMS) | — |

Nav is Portfolio / Course / Contact (`pageNav` in `lib/site.ts`), with the
category filter taxonomy on the left rail (desktop) or in the top bar (mobile).
`components/app-shell.tsx` picks the frame per route: `/links` renders bare,
`/product/*` full-bleed with a footer, everything else rails + offset content +
footer.

**The Studio/about page is currently disabled.** Its route lives at
`app/(portfolio)/_studio/`, and Next.js excludes `_`-prefixed folders from
routing, so `/studio` 404s. To bring it back: rename the folder to `studio` and
restore `{ href: "/studio", label: "Studio" }` in `pageNav`. The `studio`
singleton, its schema and its getter are all still live.

`app/sitemap.ts` and `app/robots.ts` are generated from the same CMS-backed
getters. Neither lists `/admin` or `/links`, and robots.txt disallows `/admin`
outright — safe only because nothing links to it. `/links` is left crawlable on
purpose: it is kept out of the index by `noindex` on the page, and a crawler
blocked from fetching it would never read that. While coming-soon mode is on the
sitemap is empty and robots disallows everything.

Global chrome (rail / top bar, footer) and the newsletter card read the
`settings` and `newsletter` singletons.

## Content model (Sanity ↔ seed)

Every Sanity type mirrors a local seed shape in `lib/*`, so the two are
interchangeable. Schemas live in `sanity/schemas/`, queries + result types in
`sanity/lib/queries.ts`, and the cached, fallback-aware getters in
`sanity/lib/fetch-data.ts`. Adding a field means touching all four, plus the seed
type.

**Repeatable**

- **`product`** — `ref` (unique, uppercase, = URL slug), `name`, `type`,
  `made` (date — **the sort key**), `category`, `material` (Silver / Gold /
  Stainless Steel / Aluminium / Ceramics / Wax / Polymer / Other),
  `description`, `media[]`, and the optional `format` (Digital / Physical),
  `details`, `weight`, `dimensions`, `leadTime`, `price` (string incl.
  currency). Every optional field is hidden
  when blank, so a piece can go up before its price or measurements are settled.
  Mirrors `Product` in `lib/products.ts`.
  - `material` and `format` options are spread from the `materials` / `formats`
    lists in `lib/products.ts`, so the Studio's radio lists and the seed's
    `Material` / `Format` unions can't drift — those lists are not CMS-editable,
    which is what makes a single source possible.
  - `format` is stored but **nothing reads it yet**; it exists so the archive can
    be split into digital / physical / all later. It is deliberately optional:
    every piece predating the field would otherwise open in a validation error
    state, so "unset" is a real value and a future filter must treat it as
    showing only under "all", never as a third bucket.
  - `category` options are **not** in the same position. The Studio's radio list
    comes from the `categories` fallback in `lib/site.ts`, while the rail and
    `resolveFilter` use the live `settings.categories` from Sanity, so the two
    *can* drift: add a category in Site Settings and it appears as a rail filter
    that no piece can be assigned to, which shows an empty run with every piece
    collapsed to a swatch. Until the schema can read the settings document,
    adding a category means editing `lib/site.ts` too.
  - `ref` uniqueness is enforced by an async validation rule that queries the
    dataset (ignoring the document's own draft/published pair).
- **`course`** — `key`, `label`, `headline`, `intro`, `price`, `meta`, `level`,
  `length`, `checkoutUrl`, `heroImage`, `modules[]` `{ no, title, body, duration }`,
  `includes[]`, `order` (lower = left-most toggle), `enabled`. Only `key` / `label` /
  `headline` are required. Mirrors `Course` in `lib/courses.ts`.
  - `enabled` off drops the course from the page — its toggle tab goes and the
    rest take over; with one course left the tab strip goes too. `getCourses`
    applies it and **fails open**: disabling every course keeps the first rather
    than serving an empty page, because hiding the offering is
    `coursePageEnabled`'s job below. Like `order`, it stays out of the `Course`
    type — it is a publishing control, not content.

**Singletons**

- **`studio`** — `headline`, `paragraphs[]`, `specs[]` `{ label, value }`.
- **`contact`** — `details[]` `{ label, value, href }`, `commissionHeadline`,
  `commissionIntro`, `commissionSteps[]` `{ no, title, body }`,
  `commissionPricingTabs[]` `{ key, label, items[] { label, value } }`.
- **`links`** — `socials` (Instagram / TikTok / Facebook / YouTube / Threads /
  Pinterest / X — empty channels are hidden) and `items[]` `{ label, actionType
  (internal / external / newsletter), href }`.
- **`newsletter`** — `headline`, `microcopy`.
- **`settings`** — `name`, `tagline`, `email`, `instagram`, `footer`,
  `categories[]` (the filter taxonomy; the `"All pieces"` reset entry is
  prepended automatically, so it isn't listed there), `coursePageEnabled`
  (unset counts as on; off both hides the nav entry and makes `/course` a real
  404, and drops it from the sitemap), plus the coming-soon switch:
  `maintenanceMode`, `maintenanceHeadline`, `maintenanceMessage`.
  Mirrors `lib/site.ts`.

### Media

`product.media[]` accepts stills, GIFs and video clips, and the site renders
them: the run shows a piece's first item with the second as a hover overlay, and
the product page switches between all of them.

How a file is served depends on its real mime type, resolved once in
`productMedia()` (`sanity/lib/fetch-data.ts`). Components never see a Sanity
asset reference — they receive `ProductMedia` objects carrying a ready-to-render
`url` plus the `kind` (`image` / `video`) and `animated` flags they render from.
Those two flags are load-bearing. If `animated` is lost, the optimiser flattens
a GIF to a single frame; if `kind` is lost, a clip renders as an `<img>` instead
of a `<video>`.

- **stills** go through the Sanity image pipeline (`urlFor`, width 1600,
  `auto("format")`), passed as a full image object so the hotspot/crop set in the
  Studio is honoured — a bare asset id has nothing to crop against;
- **GIFs and video** are served straight from the CDN and bypass the Next image
  optimiser, which would otherwise flatten a GIF to a single frame.

A video clip also takes an optional **poster frame** — a still, authored beside
the clip in the Studio and resolved through the same image pipeline, that the
browser shows in its place until enough of the clip has arrived to play. Without
one the piece is an empty rectangle for the whole of that wait, which on a phone
is most of the time a visitor spends looking at it.

The catalogue's lead piece — the first one shown at full size — is loaded with
`priority`, so it is preloaded from the document head rather than discovered
after layout; every piece below it stays lazy. The hover overlay (a piece's
second media item) is mounted **only** where the pointer can hover, so a phone
never fetches a second full-size image per piece for a state it cannot reach.

A piece with **no** media falls back to the sage placeholder renders, so an
unphotographed piece still reads as designed. The course preview and the Studio
portrait are still placeholders — `course.heroImage` is authored in the schema
but not yet queried or rendered.

### Ordering

The run is ordered by `made` — the date the piece was *finished* — newest first,
independent of when it was entered in the CMS. GROQ sorts it (`_createdAt` only
breaks same-day ties) and `getProducts` re-applies the same comparison so the
local seed obeys the identical rule. The compare is a plain lexicographic one on
ISO-8601 strings, deliberately not `localeCompare`, which the runtime's locale
could reorder.

Because `made` is the sort key it is also a filter: `allProductsQuery` drops any
product without one. The Studio requires the field, so this only bites documents
written through the API or predating it — but note the failure is silent, the
piece simply never appears and its URL 404s. To check a dataset:
`*[_type == "product" && !defined(made)]{_id, ref}`.

## How fetching + fallback works

`sanity/lib/fetch-data.ts` exposes one getter per type (`getProducts`,
`getProduct`, `getCourses`, `getStudio`, `getContact`, `getLinks`,
`getNewsletter`, `getSettings`) and is the only module pages fetch content
through. Each getter:

1. returns the local seed immediately when Sanity is unconfigured
   (`isSanityConfigured` is false);
2. queries Sanity when configured;
3. falls back to the seed when the query returns nothing — or throws, in which
   case the error is logged so a flaky/misconfigured CMS stays observable
   instead of taking the site down.

Singletons coalesce **per field**, so a half-filled document keeps whatever the
editor has entered and falls back to the seed for the rest rather than blanking a
section. Queries also `defined()`-filter on fields the result types declare
non-optional (`ref`, `made`, a course's `key`/`label`/`headline`), because schema
validation only binds at edit time — a document written through the API, or
predating a field, could otherwise arrive as `null` against a type promising a
string.

Getters are wrapped in React `cache()`, so multiple server components in one
request (the footer, the nav, `generateMetadata` and the page all reading
`settings`) share a single fetch. Pages use ISR (`revalidate = 60`), and
`sanityFetch` tags every query by document type so a future `/api/revalidate`
webhook can invalidate on publish.

## Draft preview

Editors can see unpublished edits on the real site before publishing them. It is
off by default and per-browser: the published site is unchanged, still static,
still on ISR.

Open **Presentation** in the Studio at `/admin`. It shows the site in a frame
beside the document being edited, and edits appear without a reload. Behind that:

1. Presentation writes a one-time `sanity.previewUrlSecret` document and sends
   the browser to `/api/draft/enable?sanity-preview-secret=…`.
2. That route validates the secret against the dataset — which is what
   `SANITY_API_TOKEN` is for — and turns on Next.js draft mode (a cookie).
3. `isDraftEnabled()` (`sanity/lib/draft.ts`) is then true for the rest of that
   browser's requests, so every getter reads through `previewClient` instead:
   `perspective: "drafts"`, no CDN, no caching.
4. A black **Draft preview** bar sits in the corner of every page. Its *Exit*
   link hits `/api/draft/disable`, which clears the cookie and puts the browser
   back on the published, cached site.

Two deliberate limits:

- **Preview is not visual editing.** Click-to-edit overlays need stega, which
  works by hiding invisible marker characters inside every string Sanity
  returns. This site compares CMS strings for equality in several places — the
  category filter, link `actionType`, pricing tab keys — and those comparisons
  would quietly stop matching in preview only. `previewClient` sets
  `stega: false`; enabling it means auditing every such comparison first.
- **No token, no preview.** `/api/draft/enable` answers 401 and the site stays
  published. That is the same posture as the rest of the CMS wiring: an
  unconfigured deployment degrades to something that still works.

Coming-soon mode is lifted in draft preview, for the same reason it is lifted in
development — previewing the site behind the curtain is the point, and getting
there already required a token-validated secret from the Studio.

## Coming-soon mode

`settings.maintenanceMode` puts a curtain over the whole public site without a
deploy. It's gated in `app/(portfolio)/layout.tsx` — the highest point that
already has `settings` in hand — and skipped in development and in
[draft preview](#draft-preview), so the site stays workable while production
shows the notice. `/admin` sits in its own route group and is unaffected.

Note what this does and doesn't guarantee: Next renders a layout and its page in
parallel, so the page underneath still executes its queries; returning the notice
instead of `children` discards that output. It hides the site — it is not a way
to stop the work behind it happening.

## Newsletter

`components/newsletter-card.tsx` → `POST /api/newsletter` → `lib/mailerlite.ts`.
Subscribers are created as `unconfirmed` so MailerLite sends the confirmation
email; that requires **"Double opt-in for API and integrations"** to be ON in
Account settings → Subscribe settings.

Throttling is **not** in the route handler. `netlify/edge-functions/newsletter-guard.ts`
is an empty pass-through function whose only job is to carry a `rateLimit` config
(3 requests / 180 s, bucketed by ip + domain) that Netlify enforces before any
code runs — so an over-limit request costs no compute, and the 429 a client sees
is Netlify's. It's scoped by `path` to the one endpoint rather than being
middleware, which would run on every page and static asset. `next dev` doesn't
run edge functions; use `pnpm dev:netlify` to test it. The trade-off is Netlify's
180 s ceiling on `windowSize`: this is burst protection, not an hourly quota.

What stays in the handler is application-level — a `companyUrl` honeypot
(deliberately not named `company`, which is a real MailerLite field) and format
validation.

## Singletons in the Studio

`studio` / `contact` / `links` / `newsletter` / `settings` are edited as single
fixed-id documents, enforced in two places that must stay in sync:
`sanity/structure.ts` (the `singletonTypes` set + list items that open the one
document) and `sanity.config.ts` (document actions filtered to publish / discard /
restore, and singletons hidden from the global "Create new" menu).

---

See `ROADMAP.md` for the phased plan and what's still ahead (webhook
revalidation, draft preview, digital products, e-commerce), and `CLAUDE.md` for
notes aimed at agents working in this repo.
