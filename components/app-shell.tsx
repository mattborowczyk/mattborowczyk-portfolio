"use client";

import { usePathname } from "next/navigation";

import { PageFade, PageTransitionProvider } from "@/components/page-transition";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import type { SiteSettings } from "@/sanity/lib/fetch-data";

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

  if (pathname === "/links") {
    return (
      <PageTransitionProvider>
        <main className="min-h-screen pt-draft">{page}</main>
      </PageTransitionProvider>
    );
  }

  return (
    <PageTransitionProvider>
      {/* No Suspense boundary here any more. There used to be one, standing in
          for the whole nav with a pair of empty rails, because `SiteNav` read
          the query string at its top level and so could not be prerendered.
          That fallback was what every static page actually shipped: no
          wordmark, no menu, no mobile bar until the bundle hydrated. The
          boundary now sits inside `SiteNav`, around the filter list alone. */}
      <SiteNav settings={settings} />
      <div className="min-h-screen pt-topbar-draft nav:pt-draft nav:pl-rail nav:pr-rail-right">
        {/* Every page begins at the same height, and it is set here rather than
            by each page, so the answer cannot drift page by page — it used to,
            and the catalogue, the product page and Contact all opened on a
            different line. `/links` is outside this branch and keeps its own
            frame: it centres itself in the viewport and has no top edge to
            share. */}
        <main className="pt-section-lg">{page}</main>
        <SiteFooter settings={settings} />
      </div>
    </PageTransitionProvider>
  );
}
