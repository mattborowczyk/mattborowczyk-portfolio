#!/usr/bin/env bash
#
# Creates labels + all roadmap issues in the GitHub repo.
# Run AFTER setup-github.sh, from inside the project folder, on your Mac.
#
#   chmod +x create-issues.sh
#   ./create-issues.sh
#
# Safe to re-run: label creation ignores "already exists" errors. Re-running
# WILL create duplicate issues, so only run the issue section once.
#
set -euo pipefail
cd "$(dirname "$0")"

echo "▶ Ensuring labels exist..."
gh label create tech          --color 1f6feb --description "Engineering task"            2>/dev/null || true
gh label create design        --color 8957e5 --description "Needs Mateusz's design/product input" 2>/dev/null || true
gh label create high-priority --color d73a4a --description "Do first — unblocks other work" 2>/dev/null || true
gh label create phase-1-media --color 0e8a16 --description "Phase 1: mixed-media content model" 2>/dev/null || true

# helper: mk "title" "body" "label1,label2"
mk () {
  gh issue create --title "$1" --body "$2" --label "$3" >/dev/null
  echo "  + $1"
}

echo "▶ Creating issues..."

# ── Phase 0 — Repo & project hygiene ──────────────────────────────────────
mk "Add project README + env documentation" \
"Add a real README.md: project intro, local-dev steps (\`npm install\`, \`npm run dev\`, \`npm run sanity\`), and a table of required env vars (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, MAILERLITE_API_KEY, MAILERLITE_GROUP_ID). See ROADMAP.md Phase 0." \
"tech"

mk "Add CI workflow (typecheck + build)" \
"GitHub Actions workflow that runs on PRs: install deps, \`tsc --noEmit\`, and \`next build\`. Prevents broken builds from merging. ROADMAP.md Phase 0." \
"tech"

# ── Phase 1 — Mixed-media content model (highest priority) ────────────────
mk "Extend Sanity piece schema for mixed media (image/video/GIF/3D)" \
"The piece schema currently only has an \`images\` array. Replace/extend with a flexible \`media\` array supporting: image, video (file or external URL), animated GIF, and 3D model (.glb/.usdz). This is the foundation for the whole visual portfolio. ROADMAP.md Phase 1." \
"tech,high-priority,phase-1-media"

mk "Integrate video host and player" \
"Pick and integrate a video host (see design issue 'Decide video & 3D hosting'). Add upload/reference field in Sanity and a player component. Mux has an official Sanity plugin with adaptive streaming. ROADMAP.md Phase 1." \
"tech,high-priority,phase-1-media"

mk "Add in-browser 3D model viewer (<model-viewer>)" \
"Render .glb/.usdz models as rotatable 3D viewers using Google's <model-viewer> web component. Used for showcasing 3D renders directly. ROADMAP.md Phase 1." \
"tech,high-priority,phase-1-media"

mk "Render mixed media in PieceCard + detail gallery; fix animated GIFs" \
"Update PieceCard and the piece detail page to render image/video/GIF/3D. IMPORTANT: next/image optimises animated GIFs to a static first frame — serve animated assets with the \`unoptimized\` prop or via the video host. Add poster/still previews that play on hover/click. ROADMAP.md Phase 1." \
"tech,high-priority,phase-1-media"

# ── Phase 2 — Editorial layout & design system ────────────────────────────
mk "Wire fonts via next/font and Tailwind fontFamily" \
"Tailwind config has empty fontFamily placeholders and no fonts are loaded. Load chosen typefaces with next/font and map them in tailwind.config.ts. Depends on design issue 'Choose typography'. ROADMAP.md Phase 2." \
"tech"

mk "Define brand palette / design tokens" \
"Replace the placeholder stone scale in tailwind.config.ts and the CSS variables in globals.css with the real brand palette. Depends on design issue 'Define brand palette'. ROADMAP.md Phase 2." \
"tech"

mk "Build flexible gallery/grid for mixed media" \
"Build a grid/gallery system that mixes 3D renders, photography and video gracefully (uniform vs masonry — see design issue). Used on home, work, and collection pages. ROADMAP.md Phase 2." \
"tech"

mk "Responsive mobile navigation" \
"The current nav (components/nav.tsx) has no mobile menu and will overflow on small screens. Add a responsive menu (hamburger/drawer). ROADMAP.md Phase 2." \
"tech"

mk "Add page transitions or remove unused framer-motion" \
"framer-motion is a dependency but unused. Either implement page transitions / micro-interactions, or remove the dependency. ROADMAP.md Phase 2." \
"tech"

# ── Phase 3 — Content rendering & CMS completeness ────────────────────────
mk "Render About page PortableText body" \
"app/(portfolio)/about/page.tsx shows a placeholder — the About body never renders. Install @portabletext/react and render \`page.body\`, including inline images with captions. ROADMAP.md Phase 3." \
"tech"

mk "Add Collections index page (/collections)" \
"Collection detail pages exist but there is no listing page. \`allCollectionsQuery\` is already defined but unused. Build /collections. ROADMAP.md Phase 3." \
"tech"

mk "Model courses, resources, and Goldsmith Studio in Sanity" \
"Courses are hardcoded in courses/page.tsx. Create Sanity schemas for courses/digital products (brushes, presets, software access) and a section for the Goldsmith Studio app. ROADMAP.md Phase 3." \
"tech"

mk "Replace deprecated __experimental_actions singleton pattern" \
"settings schema uses the deprecated \`__experimental_actions\`. Use a proper singleton document-action setup. ROADMAP.md Phase 3." \
"tech"

# ── Phase 4 — SEO, metadata & production readiness ────────────────────────
mk "Add sitemap.ts and robots.ts" \
"Add app/sitemap.ts (generated dynamically from Sanity pieces/collections/pages) and app/robots.ts. ROADMAP.md Phase 4." \
"tech"

mk "Set metadataBase + default and per-piece OG images" \
"Root layout has no metadataBase, so OG image URLs resolve as relative. Set it, add a default social share image, and confirm per-piece OG images. ROADMAP.md Phase 4." \
"tech"

mk "Add not-found, error, and loading routes" \
"Add app-level not-found.tsx, error.tsx and loading.tsx for proper route-level UX. ROADMAP.md Phase 4." \
"tech"

mk "Add favicons, app icons, and web manifest" \
"No favicon/icons currently. Add favicon, apple-touch-icon, and manifest. ROADMAP.md Phase 4." \
"tech"

mk "Add JSON-LD structured data for pieces" \
"Add Product / CreativeWork JSON-LD to piece pages for richer search results (important once selling). ROADMAP.md Phase 4." \
"tech"

mk "Add analytics" \
"Add privacy-friendly analytics (Vercel Analytics / Plausible / Umami — see design issue). ROADMAP.md Phase 4." \
"tech"

# ── Phase 5 — Data fetching & preview correctness ─────────────────────────
mk "Implement draft/preview mode or remove SANITY_API_TOKEN" \
"SANITY_API_TOKEN is in env but never used and there's no preview wiring (client is useCdn:true always). Either implement Next.js draft mode with a preview client (useCdn:false, perspective:drafts), or remove the token to avoid confusion. ROADMAP.md Phase 5." \
"tech"

mk "Fix sanityFetch tag/revalidate logic + add /api/revalidate webhook" \
"In sanity/lib/client.ts, passing \`tags\` forces \`revalidate:false\`, so tagged content never updates without a webhook — which doesn't exist. Add an /api/revalidate route wired to Sanity webhooks (revalidateTag) and fix the logic. ROADMAP.md Phase 5." \
"tech"

mk "Deduplicate Sanity fetches with React cache()" \
"The footer and pages each fetch settingsQuery separately per request. Wrap client fetches in React cache() to dedupe. ROADMAP.md Phase 5." \
"tech"

# ── Phase 6 — Newsletter, courses & e-commerce ────────────────────────────
mk "Rate-limit /api/newsletter + add honeypot" \
"The newsletter endpoint is unprotected (spam risk). Add rate limiting and a honeypot field; review double opt-in copy. ROADMAP.md Phase 6." \
"tech"

mk "Wire real course checkout" \
"courses/page.tsx has a disabled placeholder button. Wire the real checkout once the platform is confirmed (see design issue 'Confirm course platform'). ROADMAP.md Phase 6." \
"tech"

mk "Build product → cart → checkout flow" \
"Once the e-commerce platform is chosen (see design issue), build the shop flow. \`shopifyProductId\` and the piece \`status\` field are already stubbed for this. ROADMAP.md Phase 6." \
"tech"

# ── Phase 7 — Quality, a11y & security ────────────────────────────────────
mk "Accessibility pass" \
"Skip-link, aria-current on nav, focus states, enforced alt text, and prefers-reduced-motion handling for video/GIF. ROADMAP.md Phase 7." \
"tech"

mk "Add security headers / CSP" \
"Add security headers and a Content-Security-Policy via next.config.ts headers or middleware. ROADMAP.md Phase 7." \
"tech"

mk "Performance / Core Web Vitals audit" \
"Lighthouse audit focused on the media-heavy pages; set an image/video performance budget, lazy-load below the fold, use poster frames. ROADMAP.md Phase 7." \
"tech"

# ── Design decisions (need Mateusz's input) ───────────────────────────────
mk "[Design] Choose typography (display + body)" \
"Decide the editorial typefaces. Blocks 'Wire fonts'. Provide font files/links or Google Fonts names, plus weights. ROADMAP.md design decisions." \
"design"

mk "[Design] Define brand palette / colour tokens" \
"Decide colours: background, text, muted, borders, accent; light/dark direction. Blocks 'Define brand palette'. ROADMAP.md design decisions." \
"design"

mk "[Design] Decide video & 3D hosting" \
"Choose video host: Mux (official Sanity plugin, adaptive streaming) vs Cloudflare Stream vs Vimeo/YouTube embed. Confirm <model-viewer> for 3D. Blocks Phase 1 video/3D work. ROADMAP.md design decisions." \
"design,high-priority"

mk "[Design] Gallery direction (grid vs editorial/masonry)" \
"Decide how renders, photos and video sit together: uniform grid vs editorial/masonry, aspect ratios, hover behaviour. ROADMAP.md design decisions." \
"design"

mk "[Design] Choose e-commerce platform" \
"Shopify (Storefront API / Hydrogen) vs Sanity-native commerce vs other; and target launch timing. Blocks the shop build. ROADMAP.md design decisions." \
"design"

mk "[Design] Confirm course / digital-product platform" \
"Confirm Easytools or pick an alternative (Gumroad, Teachable, Stripe). Blocks 'Wire course checkout'. ROADMAP.md design decisions." \
"design"

mk "[Design] How to feature the Goldsmith Studio app" \
"Decide placement and treatment: dedicated page, external link, in-app trial/CTA, pricing display. ROADMAP.md design decisions." \
"design"

mk "[Design] Finalise information architecture / sitemap" \
"Final nav and sitemap once Work, Collections, Courses, Resources, Shop and Studio are all in play. ROADMAP.md design decisions." \
"design"

echo "✅ All issues created."
echo "View them: gh issue list"
