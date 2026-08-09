# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned via `packageManager` in package.json; Node 22 in CI and Netlify).

```bash
pnpm dev            # next dev — site at :3000, embedded Sanity Studio at /admin
pnpm dev:netlify    # netlify dev — needed to exercise the edge function (rate limit)
pnpm build          # next build (stop `next dev` first — it clobbers .next)
pnpm lint           # eslint . (pnpm lint:fix to autofix)
pnpm exec tsc --noEmit   # typecheck — this is what actually guards types
pnpm sanity         # standalone Sanity Studio (rarely needed; /admin is the normal route)
```

There is **no test suite** — CI (`.github/workflows/ci.yml`) runs lint, `tsc --noEmit`, and build, with no
Sanity env vars, so the build exercises the local-seed fallback path. Match that before pushing.

`dist/` and `.next/` are build output. `create-issues.sh` / `setup-github.sh` are one-off repo bootstrap
scripts, not part of the build.

## Architecture

Next.js 15 App Router + React 19 + Tailwind 3 + Sanity v3, deployed on Netlify.

### The central invariant: CMS with local-seed fallback

The site must render identically **with or without** a connected Sanity project. Everything downstream
depends on this — don't introduce a code path that assumes Sanity is configured.

- `sanity/lib/client.ts` — `isSanityConfigured` (both `NEXT_PUBLIC_SANITY_PROJECT_ID` and
  `NEXT_PUBLIC_SANITY_DATASET` present), plus `sanityFetch` which sets both `revalidate` (60s ISR) and a
  per-type cache `tag`, so a future `/api/revalidate` webhook can `revalidateTag()` on publish.
  `projectId`/`dataset` fall back to placeholders rather than non-null assertions.
- `sanity/lib/fetch-data.ts` — **the only module pages should fetch content through.** One getter per type
  (`getProducts`, `getProduct`, `getCourses`, `getStudio`, `getContact`, `getLinks`, `getNewsletter`,
  `getSettings`), each wrapped in `withFallback` (seed when unconfigured → query → seed when empty/erroring,
  logging the error) and in React `cache()` so layout, nav, footer and page share one fetch per request.
  Singletons coalesce **per field**, so a half-filled document doesn't blank a section.
- `lib/products.ts`, `lib/courses.ts`, `lib/content.ts`, `lib/site.ts` — the seed. Every Sanity schema mirrors
  a type here; changing one means changing the schema, the GROQ projection in `sanity/lib/queries.ts`, the
  result type, and the seed together.

When adding a field: schema (`sanity/schemas/*`) → projection + `*Result` type (`sanity/lib/queries.ts`) →
normalisation/fallback (`sanity/lib/fetch-data.ts`) → seed type (`lib/*`) → component.

GROQ queries deliberately `defined()`-filter on fields the result type declares non-optional (e.g. `ref`,
`made`), because schema validation only binds at edit time — API-written or older documents can violate it.

### Draft preview

Same invariant, one level up: `SANITY_API_TOKEN` is optional, and without it every request stays on the
published path. Entry point is the Presentation tool in the Studio, not a hand-rolled `?secret=` link.

- `sanity/lib/draft.ts` — `isDraftEnabled()`. Lives apart from `client.ts` because it imports `next/headers`,
  and `client.ts` is pulled into the Studio's *client* bundle by `sanity.config.ts`. Its `try/catch` is
  load-bearing: `generateStaticParams` runs with no request store and `draftMode()` throws there. During an
  ordinary prerender it returns `false` without opting the route into dynamic rendering — **check the build
  output still shows `/` and `/product/[ref]` as static if you touch this.**
- `sanity/lib/client.ts` — `previewClient` (`perspective: "drafts"`, `useCdn: false`, `stega: false`) and
  `sanityFetch({ draft })`, which drops ISR + tags for draft reads. `sanityFetch` takes the *decision*, never
  reads it.
- `sanity/lib/fetch-data.ts` — `cmsFetch` applies that decision once for all getters. New getters go through
  it, not `sanityFetch`.
- `app/api/draft/enable` (`defineEnableDraftMode`, guarded so a tokenless deploy 401s instead of throwing a
  bare 500) and `app/api/draft/disable` (path-validated redirect). `components/draft-banner.tsx` + Next's
  `VisualEditing` mount only in draft mode; the coming-soon curtain is lifted there.

Stega stays **off**. It hides invisible characters inside every string, and the site compares CMS strings for
equality (category filter, link `actionType`, pricing tab keys) — turning it on means auditing those first.

### Ordering and media

- The catalogue run is ordered by `made` (the ISO date the piece was finished), **newest first** — not
  `_createdAt`, not array order. GROQ sorts it, and `byMadeDesc` in `fetch-data.ts` re-applies the same rule
  so the seed obeys it too. Lexicographic compare on ISO strings, intentionally not `localeCompare`.
- `productMedia()` resolves media to `ProductMedia` objects (`url` + `kind` + `animated`) before it
  reaches components, so no component handles an asset ref. Anything animated
  (video, GIF — detected by `_type === "file"` or mime) bypasses the image pipeline and the Next optimiser,
  because the pipeline flattens GIFs to one frame. Stills go through `urlFor(...)` as a **full image object**
  (asset ref + hotspot + crop), not a bare asset id, or the Studio's crop is silently ignored.

### Routing

- `app/(portfolio)/` — public site, wrapped by `AppShell` (client component) which picks the frame by
  pathname: `/links` bare, `/product/*` full-bleed, everything else rails/top-bar + footer.
- `app/(studio)/admin/[[...tool]]` — the embedded Studio. Separate route group, so it is **not** behind the
  coming-soon curtain.
- `app/(portfolio)/_studio/` — the Studio/about page is **disabled**: the `_` prefix excludes the folder from
  routing, so `/studio` 404s. To restore, rename to `studio` and re-add the nav entry in `lib/site.ts`
  (`pageNav`).
- Pages set `export const revalidate = 60`; `generateMetadata` reuses the same `cache()`d getters as the
  render, so it costs no extra fetch.

### Coming-soon / maintenance mode

Gated in `app/(portfolio)/layout.tsx`, not middleware — the flag lives in Sanity `settings`
(`maintenance.enabled`) so it flips without a deploy, and the layout already has settings in hand. It is
skipped in development. Note it *hides* the site: Next renders layout and page in parallel, so the page
underneath still runs its queries; the output is discarded. If the work behind it ever must not happen, the
gate has to move to middleware.

### Newsletter

`components/newsletter-card.tsx` → `POST /api/newsletter` → `lib/mailerlite.ts` (double opt-in via
`status: "unconfirmed"`; requires that setting to be on in the MailerLite account).

Rate limiting is **not** in the route handler. `netlify/edge-functions/newsletter-guard.ts` is an empty
pass-through function whose only purpose is to carry a `rateLimit` config that Netlify enforces before any
code runs (3 requests / 180s, bucketed by ip+domain). It's scoped by `path` to `/api/newsletter` rather than
being middleware, so it never runs on pages or static assets. The 429 clients see is Netlify's. The handler
keeps only application-level concerns: the `companyUrl` honeypot (deliberately not named `company`, a real
MailerLite field) and format validation.

### Sanity Studio structure

`studio`, `contact`, `links`, `newsletter`, `settings` are singletons — fixed document ids, enforced in two
places that must stay in sync: `sanity/structure.ts` (`singletonTypes` + list items that open the one
document) and `sanity.config.ts` (filters document actions to publish/discard/restore, and hides them from
"Create new"). Adding a singleton means touching both.

### Styling

Tailwind is the interface to the design system; the actual values are CSS custom properties in
`app/globals.css`, referenced from `tailwind.config.ts` (`--fs-*`, spacing, colours). Change tokens in
globals.css, not in the Tailwind config. One design breakpoint, `nav` (860px), switches the desktop rails to
the mobile top bar. Fonts: `font-serif` Cormorant Garamond (display), `font-mono` IBM Plex Mono (specs,
labels, eyebrows), `font-sans` Helvetica Neue (UI, nav, product names).

## Conventions

- Import via the `@/*` path alias.
- Server components fetch; client components receive plain serialisable props (`AppShell` takes `settings`
  from the server layout rather than fetching).
- The site is a **catalogue, not a shop** — "buy" is a `mailto:` commission enquiry. British English (`en-GB`)
  in copy and in CodeRabbit config.
- Comments here explain *why* a non-obvious choice was made; that density is the house style — preserve the
  rationale when editing those blocks.
- `.agents/skills/sanity-best-practices/` is a vendored skill (pinned in `skills-lock.json`) — consult it for
  schema/GROQ/TypeGen/Visual Editing work.

## Notes on the docs

`README.md` carries the project narrative and was last reconciled against the code on 2026-08-08 — keep it
accurate when changing the content model, routes or the media pipeline. `ROADMAP.md` tracks the phased plan
and has not been re-checked; treat its "where things stand" section as older than the code.
