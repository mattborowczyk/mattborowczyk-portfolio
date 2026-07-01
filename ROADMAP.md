# mattborowczyk — Roadmap

Editorial portfolio for **Matt Borowczyk** (hand-made silver & gold jewellery
and objects) — an editorial catalogue + Studio/about + a two-course landing page
+ Contact/commission + a hidden bio-links page, editable via an embedded Sanity
Studio at `/admin`. Built to grow into course checkout and, later, a shop.

Stack: **Next.js 15** (App Router, React 19, TS) · **Tailwind 3** · **Sanity v3**
(embedded Studio at `/admin`; public Studio page at `/studio`) · **MailerLite**
(newsletter) · planned **Easytools** (course checkout) / **Shopify** (shop).

---

## Where things stand

The **editorial rebuild is complete** (Phases 1–3, merged to `main`). The site
renders end-to-end from Sanity with a local-seed fallback, so it works with or
without a connected CMS. What's left is **production hardening** (SEO, a11y,
security, analytics), **real media**, and the **commerce / course-checkout**
layer.

**Legend:** `[x]` done · `[ ]` to do · ⚙️ = code task (has a GitHub issue) ·
🔴 = needs Matt (content, asset, or a product decision).

---

## ✅ Done — the rebuild (Phases 1–3)

- [x] Project `README.md` + env-var documentation *(#1)*
- [x] Fonts via `next/font` — Cormorant Garamond, IBM Plex Mono, Helvetica *(#7, #31)*
- [x] Brand palette / design tokens in `tailwind.config.ts` + `globals.css`
      (bone/champagne, sage, ink, gold; `nav` breakpoint 860px) *(#8, #32)*
- [x] Editorial catalogue run, product page, Studio, Course, Contact, Links *(#9, #34)*
- [x] Responsive nav — desktop rail + mobile top bar *(#10)*
- [x] Newsletter card wired to MailerLite (`/api/newsletter`)
- [x] **Sanity content model**: `product` + `course` (repeatable), `studio` /
      `contact` / `links` / `newsletter` / `settings` (singletons), each mirroring
      a local seed in `lib/*`, with per-field fallback *(#14)*
- [x] Real singleton document actions (no create/duplicate/delete) replacing the
      deprecated `__experimental_actions` *(#15)*
- [x] `sanityFetch` tag/revalidate bug fixed (`tags` + `revalidate` coexist) *(part of #23)*
- [x] Per-request fetch dedupe with React `cache()` *(#24)*
- [x] `metadataBase` set in the root layout *(part of #17)*

---

## ⚙️ Remaining — code tasks (tracked as GitHub issues)

Ready to pick up in a fresh session — each issue below has been rewritten with
full, self-contained context (files, patterns, acceptance criteria).

**Ready now (no dependencies):**
- [ ] ⚙️ CI: GitHub Actions typecheck + build on PRs *(#2)*
- [ ] ⚙️ `app/sitemap.ts` + `app/robots.ts` (sitemap dynamic from Sanity) *(#16)*
- [ ] ⚙️ `not-found.tsx`, `error.tsx`, `loading.tsx` route files *(#18)*
- [ ] ⚙️ JSON-LD structured data (`Product` / `CreativeWork`) on product pages *(#20)*
- [ ] ⚙️ Analytics (Vercel Analytics — lightest fit; confirm in #21) *(#21)*
- [ ] ⚙️ Draft/preview mode with `SANITY_API_TOKEN`, **or** remove the unused token *(#22)*
- [ ] ⚙️ `/api/revalidate` webhook → `revalidateTag` on Sanity publish *(#23)*
- [ ] ⚙️ Rate-limit `/api/newsletter` + add a honeypot field *(#25)*
- [ ] ⚙️ Accessibility pass (skip-link, `aria-current`, focus states, reduced-motion) *(#28)*
- [ ] ⚙️ Security headers / CSP in `next.config.ts` *(#29)*
- [ ] ⚙️ Default + per-product OG share images — generated with `next/og`, no asset
      needed (bespoke photo optional later) *(#17)*
- [ ] ⚙️ Favicons, app icons, web manifest — generated monogram, no asset needed
      (bespoke logo optional later) *(#19)*

**Blocked on an asset or decision:**
- [ ] ⚙️🔴 Render real product images with `next/image`, swap the sage placeholders
      (needs real 3D render stills) *(#6, reframed)*
- [ ] ⚙️🔴 Product → checkout / commerce flow (needs the platform decision, #35) *(#27)*
- [ ] ⚙️ Performance / Core Web Vitals audit — do **after** real media lands *(#30)*

**Future media (when real assets + a host are chosen):**
- [ ] ⚙️🔴 Model video / GIF / 3D on the `product` schema *(#3, reframed)*
- [ ] ⚙️🔴 Integrate a video host + player *(#4)*
- [ ] ⚙️🔴 In-browser 3D viewer (`<model-viewer>`) for `.glb` renders *(#5)*

---

## 🔴 Remaining — needs Matt

These can't be done in code alone. See "Action items for Matt" at the bottom.

**Content & assets**
- 🔴 **3D render stills** for each product (primary + extra views) — unblocks #6,
      #17, #19, #30. Until these arrive the site shows sage placeholders.
- 🔴 **A logo/mark** (even a simple wordmark glyph) for favicon / app icons (#19)
      and a **default social share image** (#17).
- 🔴 **Live Easytools checkout URLs** for the two courses (#26). Until then the
      Enrol buttons render disabled ("opening soon").
- 🔴 Final **copy review** on Studio / Contact / course modules (currently the
      handoff placeholder copy, editable in the CMS).

**Product decisions** (open design issues)
- 🔴 **Video & 3D hosting** — Mux vs Cloudflare Stream vs `<model-viewer>` *(#33)*
- 🔴 **E-commerce platform** — Shopify vs Sanity-native vs other; shop timing *(#35)*
- 🔴 **Course platform** — confirm Easytools, or Gumroad/Teachable/Stripe *(#36)*
- 🔴 **Goldsmith Studio app** — how it's featured (page, link-out, trial) *(#37)*
- 🔴 **Final IA** once Shop / Resources are in play — mostly settled by the
      rebuild; revisit when commerce lands *(#38)*

---

## Superseded / dropped

Closed because the rebuild took the design-handoff direction:

- ~~Extend the `piece` schema for mixed media~~ — `piece` was replaced by
  `product` (has `images[]`); rich media reframed as #3.
- ~~Render mixed media in `PieceCard`~~ — no `PieceCard`; reframed as #6.
- ~~Page transitions / remove unused framer-motion~~ — framer-motion was never a
  dependency; motion is CSS keyframes (#11, closed).
- ~~Render About PortableText body~~ — About is the `studio` singleton with plain
  paragraphs, already rendered (#12, closed).
- ~~Collections index page~~ — the catalogue is a single flat editorial run
  filtered by category; there are no collections (#13, closed).
- ~~Choose typography / palette / gallery direction~~ — all decided by the
  rebuild (#31, #32, #34, closed).

---

*Update checkboxes as work lands, or close the matching GitHub issue.*
