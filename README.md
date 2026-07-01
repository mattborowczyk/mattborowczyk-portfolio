# mattborowczyk — studio site + course landing + CMS

Editorial portfolio for **Matt Borowczyk**, a studio making hand-made silver &
gold jewellery and objects (signet rings, lighter cases, belt buckles, napkin
rings, pendants). It's an editorial **catalogue** (not a shop — every "buy" is a
`mailto:` commission enquiry), plus a Studio/about page, a two-course landing
page, a Contact page that absorbs the commission flow, and a hidden bio-links
page. Content is editable in an embedded **Sanity Studio** at `/admin`, and the
site falls back to a local seed so it renders with or without a connected CMS.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — SSG/ISR
- **Tailwind CSS 3** — design tokens in `tailwind.config.ts` (bone/champagne,
  sage, ink, gold; `nav` breakpoint = 860px). Square corners, hairline borders,
  Cormorant Garamond / IBM Plex Mono / Helvetica.
- **Sanity v3** — embedded Studio at `/admin` (the public Studio page owns
  `/studio`)
- **MailerLite** — newsletter subscribe (`/api/newsletter`)
- Planned: **Easytools** (course checkout), **Shopify** (shop)

## Local development

```bash
npm install
npm run dev      # http://localhost:3000  (Studio at /admin)
npm run build    # production build — stop `next dev` first (it clobbers .next)
npx tsc --noEmit # typecheck
```

The site runs **with no configuration**: when Sanity env vars are absent it
serves the local seed in `lib/*`. Add a `.env.local` (see
`.env.local.example`) to connect a real Sanity project and MailerLite.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for CMS | Sanity project. Without it (or the dataset) the site renders entirely from the local seed. |
| `NEXT_PUBLIC_SANITY_DATASET` | for CMS | Sanity dataset (e.g. `production`). |
| `SANITY_API_TOKEN` | no | **Currently unused.** Reserved for draft/preview mode (Next.js draft mode + a `useCdn:false` preview client). Documented as a future step — safe to leave unset. |
| `MAILERLITE_API_KEY` | for newsletter | MailerLite API key. |
| `MAILERLITE_GROUP_ID` | no | Group/segment subscribers are added to. |

## Information architecture

Real routes (the prototype's client-side "router" became App Router pages):

| Route | Page | Source |
| --- | --- | --- |
| `/` | Catalogue — editorial run, filtered by `?filter=` | `product` |
| `/product/[ref]` | Product — full-bleed, spec sheet, commission CTA | `product` |
| `/studio` | Studio / about | `studio` singleton |
| `/course` | Course landing — two courses behind a toggle | `course` |
| `/contact` | Contact + commission explainer | `contact` singleton |
| `/links` | Hidden bio-link hub (not in nav) | `links` singleton |
| `/admin` | Embedded Sanity Studio (the CMS) | — |

Global chrome (left rail / mobile top bar, footer) and the newsletter card read
the `settings` and `newsletter` singletons.

## Content model (Sanity ↔ seed)

Every Sanity type mirrors a local seed shape in `lib/*`, so the two are
interchangeable. Schemas live in `sanity/schemas/`, queries + result types in
`sanity/lib/queries.ts`, and the cached, fallback-aware getters in
`sanity/lib/fetch-data.ts`.

**Repeatable**

- **`product`** — `ref` (unique, = URL slug), `name`, `type`, `category`
  (Rings / Objects / Hardware / Tableware), `material` (Silver / Gold), `finish`,
  `weight`, `dimensions`, `leadTime`, `price` (string incl. currency),
  `description`, `images[]` (first = primary, rest = views), `order`. Mirrors
  `Product` in `lib/products.ts`.
- **`course`** — `key`, `label`, `headline`, `intro`, `price`, `meta`, `level`,
  `length`, `checkoutUrl`, `heroImage`, `modules[]` `{ no, title, body, duration }`,
  `includes[]`, `order`. Mirrors `Course` in `lib/courses.ts`.

**Singletons**

- **`studio`** — `headline`, `paragraphs[]`, `specs[]` `{ label, value }`.
- **`contact`** — `details[]` `{ label, value, href }`, `commissionHeadline`,
  `commissionIntro`, `commissionSteps[]`, `commissionPricing[]`.
- **`links`** — `items[]` `{ label, actionType (internal / external / newsletter),
  href }`.
- **`newsletter`** — `headline`, `microcopy`.
- **`settings`** — `name`, `tagline`, `email`, `instagram`, `footer`,
  `categories[]` (the filter taxonomy; `"Shop all"` is prepended automatically).
  Mirrors `lib/site.ts`.

> **Images are authored but not yet rendered.** `product.images` / `course.heroImage`
> exist in the schema for when real 3D stills land; the live site still shows the
> sage placeholder renders. Swapping them in is a future step.

## How fetching + fallback works

`sanity/lib/fetch-data.ts` exposes one getter per type (`getProducts`,
`getCourses`, `getStudio`, `getContact`, `getLinks`, `getNewsletter`,
`getSettings`). Each getter:

1. returns the local seed immediately when Sanity is unconfigured
   (`isSanityConfigured` is false);
2. queries Sanity when configured;
3. falls back to the seed when the query returns nothing (or errors).

Getters are wrapped in React `cache()`, so multiple server components in one
request (e.g. the footer, the nav and a page all reading `settings`) share a
single fetch. Pages use ISR (`revalidate = 60`), and `sanityFetch` tags every
query by document type so a future `/api/revalidate` webhook can invalidate on
publish.

## Singletons in the Studio

`studio` / `contact` / `links` / `newsletter` / `settings` are edited as single
fixed-id documents. `sanity/structure.ts` links each to its one document and
`sanity.config.ts` filters the document actions (no create / duplicate / delete)
and hides singletons from the global "Create new" menu.

---

See `ROADMAP.md` for the phased plan and what's still ahead (webhook
revalidation, draft preview, digital products, e-commerce).
