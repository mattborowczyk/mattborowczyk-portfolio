"use client";

import { usePathname } from "next/navigation";

import { PageFade, PageTransitionProvider } from "@/components/page-transition";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import type { SiteSettings } from "@/sanity/lib/fetch-data";

/**
 * First focusable thing in the document, invisible until it is focused.
 *
 * Worth the few lines: the chrome puts the wordmark, up to five catalogue
 * filters and three page links ahead of the content in DOM order, so reaching
 * the first piece from the top of the archive costs nine tab presses, on every
 * route, every time. `sr-only` + `focus:not-sr-only` is the standard pair —
 * it is in the accessibility tree throughout, and it takes up space and paints
 * only while it holds focus.
 *
 * `focus:`, not `focus-visible:`: this element is unreachable by pointer, so
 * every focus it ever gets is a keyboard focus, and `focus-visible` heuristics
 * are not worth depending on for the one control that must not stay hidden.
 */
function SkipLink() {
  return (
    <a
      href="#main"
      // The padding is a `focus:` utility like the rest, and has to be:
      // `not-sr-only` resets padding to 0 as part of undoing `sr-only`, and it
      // would win over a plain `px-md py-sm` — variants are emitted after
      // unmodified utilities. Applied at the same variant it loses to the
      // padding instead, which is the point. Without it the link paints as a
      // bare 15px strip of text on ink.
      className="sr-only z-50 bg-ink font-mono text-xs uppercase tracking-wide-lg text-bone focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-md focus:py-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold-ink"
    >
      Skip to content
    </a>
  );
}

/**
 * Wraps every portfolio page and decides the frame per route:
 * - /links    → bare full-screen (the page centres itself; no rails/footer)
 * - otherwise → fixed rails (desktop) / top bar (mobile), offset content + footer
 *
 * `/product` used to be full-bleed with no rails. It is not any more: the
 * wordmark and the page menu are the frame, and a piece is somewhere you arrive
 * *from* the archive, so dropping the chrome there left the one route with no
 * way back to it but the browser's own button.
 *
 * On desktop the chrome is split in two: filters on the left, page nav on the
 * right, so the content is inset from both edges.
 *
 * `settings` is fetched once on the server (in the portfolio layout) and threaded
 * down so the nav + footer read the same CMS-with-fallback source as the pages.
 *
 * Page content goes through `PageTransition` in every branch, so navigation
 * cross-fades wherever it starts from. The rails and the footer sit outside it
 * deliberately — they are the frame, and they stay put.
 *
 * Every branch pads by `--draft-offset` so nothing starts underneath the draft
 * banner. It resolves to 0 outside draft mode, which is why these stay padding
 * on a `min-h-screen` box rather than a shorter box pushed down by a margin:
 * the element still measures exactly one viewport either way, so turning the
 * banner on never introduces a scrollbar.
 */
export default function AppShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();

  // Keyed on the pathname so each route gets a fresh element to fade in from —
  // see PageFade. Deliberately the pathname and not the full URL: a catalogue
  // filter only changes the query, and the run animates that itself.
  const page = <PageFade key={pathname}>{children}</PageFade>;

  /*
    `tabIndex={-1}` is what makes `#main` an actual destination: without it the
    fragment scrolls the page but leaves focus on the skip link, so the next
    Tab goes back into the nav — the link appears to do nothing. `outline-none`
    then suppresses the ring Firefox draws around the whole content area on
    arrival; this is a scroll target rather than a control, and the visitor
    just asked to be here, so there is nothing for a ring to tell them.
  */
  const mainProps = { id: "main", tabIndex: -1 as const };

  if (pathname === "/links") {
    return (
      <PageTransitionProvider>
        <main {...mainProps} className="min-h-screen pt-draft focus:outline-none">
          {page}
        </main>
      </PageTransitionProvider>
    );
  }

  return (
    <PageTransitionProvider>
      <SkipLink />
      {/* No Suspense boundary here any more. There used to be one, standing in
          for the whole nav with a pair of empty rails, because `SiteNav` read
          the query string at its top level and so could not be prerendered.
          That fallback was what every static page actually shipped: no
          wordmark, no menu, no mobile bar until the bundle hydrated. The
          boundary now sits inside `SiteNav`, around the filter list alone. */}
      <SiteNav settings={settings} />
      {/* A flex column, so the footer is held at the bottom of the viewport on
          a page too short to reach it.

          `min-h-screen` alone was never enough, and the reason is worth stating
          because the class makes it look solved: it sizes the *box* to a
          viewport, but in normal flow `main` still takes only its content
          height and the footer sits immediately after it — so on a short page
          the leftover space ended up *below* the footer rather than above it,
          and the footer floated somewhere up the screen. An archive filtered
          down to two or three pieces showed it plainly.

          Column flex with a growing `main` puts the slack in the one place it
          belongs. Nothing else needs to change: the footer keeps its own top
          margin as a minimum separation for pages that *are* long enough. */}
      <div className="flex min-h-screen flex-col pt-topbar-draft nav:pt-draft nav:pl-rail nav:pb-footer nav:pr-rail-right">
        {/* Every page begins at the same height, and it is set here rather than
            by each page, so the answer cannot drift page by page — it used to,
            and the catalogue, the product page and Contact all opened on a
            different line. `/links` is outside this branch and keeps its own
            frame: it centres itself in the viewport and has no top edge to
            share.

            `grow` rather than `flex-1`: the shorthand also sets `flex-basis: 0`,
            which would make the content's own height stop contributing and hand
            sizing entirely to the flex algorithm. Growing from `auto` keeps
            `main` at least as tall as what is in it and lets it take the
            remainder when there is any — which is the whole of what is wanted
            here, and leaves long pages measuring exactly as they did. */}
        <main {...mainProps} className="grow pt-section-lg focus:outline-none">
          {page}
        </main>
        <SiteFooter settings={settings} />
      </div>
    </PageTransitionProvider>
  );
}
