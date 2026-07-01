# Portfolio → E-commerce — Technical Roadmap

Editorial portfolio for **Mateusz Borowczyk** (jewellery, grillz, rings, pendants,
accessories, 3D-printed objects) that is built to transform into an e-commerce
store, plus a section for courses, digital resources (brushes, presets) and the
**Goldsmith Studio** app.

Stack: **Next.js 15** (App Router, React 19, TypeScript) · **Tailwind CSS 3** ·
**Sanity v3** (embedded Studio at `/admin`; the public Studio page owns `/studio`) ·
**MailerLite** (newsletter) · **Easytools** (planned course checkout) ·
**Shopify** (planned shop).

> **Rebuild status:** the editorial rebuild landed across three phases —
> Phase 1 (foundation + catalogue), Phase 2 (Studio/Course/Contact/Links + newsletter)
> and Phase 3 (Sanity CMS content model, wired to every page with local-seed
> fallback). See `README.md` for the current information architecture + content model.

---

## How this roadmap is organised

Work is grouped into phases. Each checklist item maps to a GitHub issue (see
`create-issues.sh`). Issues are labelled `tech` (engineering) or `design`
(needs Mateusz's input/decision). Tackle phases roughly in order — Phase 1 and 2
unblock everything else.

Status legend: `[ ]` to do · `[~]` in progress · `[x]` done.

---

## Phase 0 — Repo & project hygiene

- [ ] Initialise git, push to a private GitHub repo *(done by setup script)*
- [x] Add a real `README.md` (project intro, local-dev instructions, env vars)
- [x] Document required env vars (Sanity project ID/dataset/token, MailerLite key/group)
- [x] Confirm `npm install && npm run build` passes cleanly before further work
- [ ] Add basic CI (GitHub Actions: install + typecheck + build on PR)

## Phase 1 — Content model for mixed media *(highest priority)*

The portfolio is 3D renders, photography, GIFs **and** video. The current
`piece` schema and components only handle still images. This phase is the
foundation everything visual depends on.

- [ ] Extend the Sanity `piece` schema with a flexible **media array**: image,
      video (file or external URL), animated GIF, and 3D model (`.glb`/`.usdz`)
- [ ] Decide and integrate a **video host** (see design issue): Mux (official
      Sanity plugin + adaptive streaming), Cloudflare Stream, or Vimeo/YouTube embed
- [ ] Add a **3D viewer** for `.glb` models (`<model-viewer>` web component) so
      renders are rotatable in-browser
- [ ] Render mixed media correctly in `PieceCard` and the piece detail gallery
- [ ] Fix **animated GIF handling** — `next/image` optimises GIFs to a static
      first frame; serve animated assets with `unoptimized` or via the video host
- [ ] Add a `mediaType`/poster-frame concept so cards can show a still preview
      and play on hover/click

## Phase 2 — Editorial layout & design system

Depends on Mateusz's design guidelines & reference pages (incoming).

- [ ] Wire up **fonts** via `next/font` and populate Tailwind `fontFamily`
      (Tailwind config currently has empty placeholders)
- [ ] Define the **brand palette / design tokens** in `tailwind.config.ts` and
      `globals.css` (replace the placeholder stone scale)
- [ ] Build the **homepage hero** to match the editorial direction
- [ ] Build a flexible **gallery/grid system** that mixes renders, photos and
      video gracefully (masonry vs uniform grid — design decision)
- [ ] Add **page transitions / micro-interactions** (framer-motion is already a
      dependency but unused — either use it or remove it)
- [ ] Responsive **mobile navigation** (current nav has no mobile menu)

## Phase 3 — Content rendering & CMS completeness

> The editorial rebuild replaced the old `piece`/`collection`/`material`/`page`
> schemas with the handoff content model: `product` + `course` (repeatable) and
> `studio` / `contact` / `links` / `newsletter` / `settings` (singletons). Every
> page fetches from Sanity and falls back to the local seed (`lib/*`) when Sanity
> is unconfigured or empty, so the site renders with or without a connected CMS.
> See `README.md` for the full model.

- [x] Model **products, courses & site copy in Sanity** (`product`, `course`,
      and the `studio`/`contact`/`links`/`newsletter`/`settings` singletons)
      instead of hardcoding them — with local-seed fallback
- [x] ~~Render the About page body via Portable Text~~ — superseded: the About
      page is now the `studio` singleton (plain headline + paragraphs + spec grid)
- [x] ~~Collections index page~~ — superseded: the catalogue is a single flat
      editorial run filtered by category, so there are no collections to list
- [x] Replace deprecated `__experimental_actions` singleton pattern with proper
      singleton document actions (`sanity.config.ts` `document.actions` +
      `structure.ts`) that hide create/duplicate/delete for singletons
- [ ] Add a content type / section for the **Goldsmith Studio app** and resources
      (brushes, presets, software access) — future
- [ ] Model **digital products** (materials/brushes downloads) in Sanity — future

## Phase 4 — SEO, metadata & production readiness

- [ ] Add `app/sitemap.ts` (dynamic from Sanity) and `app/robots.ts`
- [ ] Set `metadataBase` in root layout (OG image URLs are currently relative)
- [ ] Add a **default OG/social share image** and per-piece OG images
- [ ] Add `not-found.tsx`, `error.tsx`, and `loading.tsx` (route-level UX)
- [ ] Add **favicon, app icons and `manifest`**
- [ ] Add **structured data** (JSON-LD `Product`/`CreativeWork`) for pieces
- [ ] Add **analytics** (Vercel Analytics / Plausible / Umami — design decision)

## Phase 5 — Data fetching & preview correctness

- [ ] **Draft/Preview mode**: `SANITY_API_TOKEN` is in env but still unused — no
      preview wiring yet. Future: implement Next.js draft mode + a preview client
      (`useCdn:false`, `perspective: drafts`), or drop the token. Documented as
      future in `README.md`.
- [x] Fix the `sanityFetch` **tag/revalidate logic** — `tags` and `revalidate`
      now coexist (`next: { revalidate, tags }`), so tagged content still
      time-revalidates and can also be invalidated by a webhook
- [ ] Add a **`/api/revalidate` webhook route** wired to Sanity webhooks for
      on-publish revalidation (`revalidateTag`) — the fetch layer already tags
      every query by document type, so this is a drop-in next step
- [x] **Deduplicate** Sanity fetches per request with React `cache()` — every
      getter in `sanity/lib/fetch-data.ts` is `cache()`-wrapped, so the footer,
      nav and pages share one `settings` fetch per request

## Phase 6 — Newsletter, courses & e-commerce

- [ ] Add **rate limiting** to `/api/newsletter` (currently unprotected → spam risk)
- [ ] Improve newsletter UX (honeypot, double opt-in confirmation copy)
- [ ] **Course checkout**: confirm Easytools and wire the real buy button
      (currently a disabled placeholder), or pick an alternative (design decision)
- [ ] **E-commerce platform decision** (design issue): Shopify Storefront API /
      Hydrogen vs. Sanity-native commerce vs. other. `shopifyProductId` is stubbed
- [ ] Build **product → cart → checkout** flow once the platform is chosen
- [ ] Decide how the **`status` field** (portfolio / for-sale / sold / commission)
      drives buy buttons on piece pages

## Phase 7 — Quality, a11y & security

- [ ] Accessibility pass: skip-link, `aria-current` on nav, focus states, alt-text
      enforcement, reduced-motion handling for video/GIF
- [ ] Add **security headers / CSP** (`next.config.ts` headers or middleware)
- [ ] Lighthouse / Core Web Vitals audit on the media-heavy pages
- [ ] Image/video performance budget (lazy-load below the fold, poster frames)
- [ ] Error monitoring (Sentry or similar — optional)

---

## Design decisions needed from Mateusz

These are tracked as `design`-labelled issues because they need your call before
or alongside the engineering work:

1. **Typography** — which editorial typefaces (display + body)?
2. **Brand palette** — colour tokens, light/dark, accent.
3. **Video & 3D hosting** — Mux vs Cloudflare Stream vs Vimeo/YouTube; confirm
   `<model-viewer>` for 3D renders.
4. **Gallery direction** — uniform grid vs editorial/masonry; how renders, photos
   and video sit together.
5. **E-commerce platform** — Shopify vs alternative; timing of the shop launch.
6. **Course platform** — confirm Easytools, or alternative (Gumroad, Teachable, Stripe).
7. **Goldsmith Studio app** — how it's featured (dedicated page, link out, in-app trial).
8. **Information architecture** — final nav/sitemap once Courses, Resources, Shop,
   and Studio are all in play.

---

*Generated from the technical assessment of the existing scaffold. Update the
checkboxes as work lands, or close the matching GitHub issue.*
