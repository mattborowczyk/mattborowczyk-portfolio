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
pnpm perf           # mobile Lighthouse + budget over /, a product page and /course
```

`pnpm perf` needs a **production** server already running (`pnpm build && pnpm start`) — it measures
image optimisation and prerendered HTML, neither of which `next dev` does. Point it elsewhere with
`PERF_URL=…`. See `perf/README.md` for the budget and the numbers behind it.

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

For `product` the chain has one more link: `lib/structured-data.ts`, which maps a subset of the product
fields into the JSON-LD on the product page. **Any edit to the product schema — a rename, a field that
becomes optional, a new field worth exposing — must be checked against that mapping.** It is the one
consumer nothing on screen will reveal as broken: the markup keeps validating while describing a piece that
no longer matches the page.

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
equality (category filter, link `actionType`, pricing tab keys, `defaultArchiveView`) — turning it on means
auditing those first.

### The archive's two views

`/` renders the same pieces in one of two arrangements, carried in `?view=`.

- **Column** (`components/catalogue-run.tsx`) — the run. One ordered column; filtering
  *shrinks* non-matching pieces in place rather than removing them, so the run is one
  sequence at every filter.
- **Grid** (`components/catalogue-grid.tsx`) — a lattice with deliberate holes. Filtering
  removes and reflows; survivors travel into the gaps.

Which one a bare `/` renders is `settings.defaultArchiveView`, so it flips without a deploy.
**The default view is always the one carrying no param** (`viewHref` in `lib/site.ts`) — that
is what keeps one canonical address per state whichever way the setting points, and `/` sets a
static `alternates.canonical` because otherwise every `?filter=`/`?view=` pair is separately
crawlable.

Three things about the grid are load-bearing:

- **Compositions are data**, in `lib/grid-pattern.ts`, written as pictures (`#` a piece, `F` a
  2×2 feature, `+` its footprint, `.` a deliberate void) — one per column count, because a
  composition that reads at five columns is not the same one at two. A malformed picture throws
  at parse time, so a typo fails the build rather than shipping overlapping tiles.
- **Sized by container query, not viewport.** The rails take a fixed 358px, so a viewport
  breakpoint is wrong by a whole column. `.grid-frame` declares the containment and
  `.piece-grid` inside it does the asking — an element cannot query itself. Each tile carries
  its slot for all five column counts as inline custom properties and the queries pick one; the
  alternative is measuring in JS, which cannot run during a prerender, so the server would guess
  and hydration would correct it — a layout shift on the route whose CLS budget is 0.
- **Tiles are positioned by `transform`**, not grid placement, because grid placement is not
  animatable and `transform` is.

The grid is behind a **dynamic import** and its compositions are built **on first use**. Both are
measured, not precautionary: statically imported, the column view paid the grid's download,
parse and module-init on every visit to `/`, worth 6 points and 0.6s of LCP. See `perf/README.md`.

Adding a column count means adding it in three places that nothing links: the ladder in
`globals.css`, a composition in `lib/grid-pattern.ts`, and the `sizes` steps in
`catalogue-grid.tsx` — the last is answered in viewport units while the grid is measured in
container units, so the two describe the same ladder in different languages and a mismatch is
invisible on screen.

### Ordering and media

- The catalogue run is ordered by `made` (the ISO date the piece was finished), **newest first** — not
  `_createdAt`, not array order. GROQ sorts it, and `byMadeDesc` in `fetch-data.ts` re-applies the same rule
  so the seed obeys it too. Lexicographic compare on ISO strings, intentionally not `localeCompare`.
- `productMedia()` resolves media to `ProductMedia` objects (`url` + `kind` + `animated` + `focus`)
  before it reaches components, so no component handles an asset ref. `focus` is the editor's
  hotspot as fractions, for `object-position`: a still resolves to one derivative at the asset's
  own ratio, so the hotspot has no target ratio to crop against and every frame then crops it
  with `object-cover`, which crops from the centre. Without `focus` the Studio's hotspot control
  did nothing at all — in the run as much as in the grid. Anything animated
  (video, GIF — detected by `_type === "file"` or mime) bypasses the image pipeline and the Next optimiser,
  because the pipeline flattens GIFs to one frame. Stills go through `urlFor(...)` as a **full image object**
  (asset ref + hotspot + crop), not a bare asset id, or the Studio's crop is silently ignored.

### Performance

Four rules, each of which was a measured regression before it was a rule. `pnpm perf` is the check;
`perf/README.md` has the numbers.

- **`useSearchParams` is contagious.** It makes React skip prerendering everything under the nearest
  Suspense boundary, and the fallback is what ships in the HTML. `SiteNav` used to call it at the top,
  so every static page shipped a pair of empty rails and no navigation at all until hydration. Keep
  the call in the smallest component that needs it, wrapped in its own boundary whose fallback renders
  the same markup with no param — the pattern in `site-nav.tsx` and in `app/(portfolio)/page.tsx`.
- **The page entry fade belongs to a route change, not to a first load.** `PageFade` skips its
  animation for the first page mounted in a document (`pageHasMounted` in `page-transition.tsx`).
  Painting the whole page at opacity 0 for `--duration-page` pushes LCP out by most of that duration,
  and there is no outgoing page to cross-fade with on a cold load anyway.
- **One image gets `priority`, the rest stay lazy.** The catalogue's lead piece and the product hero;
  nothing else. And the catalogue's hover overlay mounts only behind `(hover: hover) and
  (pointer: fine)`, so a phone doesn't fetch a second full-size image per piece for a state it has no
  way to reach.
- **A view that is not on screen must not be on the main thread.** See the dynamic import above.
- **Font weights are declared in `app/layout.tsx` and cost differently per family.** Cormorant is
  variable, so its weights share one file; Plex Mono is static instances, one preloaded file each.
  Only 400/500 Cormorant and 400 Plex Mono are declared, because that is all the site sets. Adding a
  weight class in a component means adding the weight there — then check whether the preload count
  went up rather than assuming either way.

### Routing

- The rail offers only categories that **have pieces** (`usedCategories`, applied inside `getSettings`
  so every consumer sees one answer). Site Settings keeps the full taxonomy — that is the editing
  vocabulary the Studio validates against. This is what makes the grid's empty state unreachable rather
  than merely handled: `resolveFilter` validates against the narrowed list, so `?filter=Earrings`
  collapses to "All pieces" like any unknown filter.
- `app/(portfolio)/` — public site, wrapped by `AppShell` (client component) which picks the frame by
  pathname: `/links` bare, everything else (including `/product/*`) rails/top-bar + footer.
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

### Security headers

`headers()` in `next.config.ts`, not `netlify.toml` — `[[headers]]` there only decorates static files, and
most of this site is rendered. Two rules: the public site gets the base set (nosniff, referrer policy,
frame options, permissions policy) plus a CSP; `/admin` gets the base set and **no CSP**, because the Studio
evaluates code at runtime, builds workers from blob URLs and talks to a shifting set of Sanity hosts. A
policy loose enough for it would be worth little on the public pages.

The CSP is a build-time constant, so three things follow. Adding a third-party script, font, embed or
analytics endpoint means adding it to the matching directive or it is simply blocked — check the console on
every route, and remember the failure is silent in `curl`. `script-src`/`style-src` keep `'unsafe-inline'`
because Next inlines the hydration payload and the product page inlines its JSON-LD; nonces would need
middleware and would make every route dynamic, which the performance rules above rule out. Don't "harden" it
by adding a nonce or hash alongside — browsers ignore `'unsafe-inline'` once either is present, which breaks
the page. `NODE_ENV` adds `'unsafe-eval'` and `ws:` in development for HMR, so a dev-only console violation
usually means that branch, not the policy. `CSP_REPORT_ONLY=true` at build time switches the header to
`Content-Security-Policy-Report-Only` for watching a change on a deploy preview; it is a rollout switch, and
the site is graded on the enforcing header.

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
