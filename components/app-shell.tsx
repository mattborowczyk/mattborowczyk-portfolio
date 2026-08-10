"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { PageFade, PageTransitionProvider } from "@/components/page-transition";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import type { SiteSettings } from "@/sanity/lib/fetch-data";

/**
 * Wraps every portfolio page and decides the frame per route:
 * - /links    → bare full-screen (the page centres itself; no rails/footer)
 * - /product  → full-bleed (no rails), footer below
 * - otherwise → fixed rails (desktop) / top bar (mobile), offset content + footer
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

  if (pathname.startsWith("/product")) {
    return (
      <PageTransitionProvider>
        <main className="min-h-screen pt-draft">{page}</main>
        <SiteFooter settings={settings} />
      </PageTransitionProvider>
    );
  }

  return (
    <PageTransitionProvider>
      <Suspense
        fallback={
          <>
            <div className="fixed bottom-0 left-0 top-draft w-rail bg-bone" />
            <div className="fixed bottom-0 right-0 top-draft w-rail-right bg-bone" />
          </>
        }
      >
        <SiteNav settings={settings} />
      </Suspense>
      <div className="min-h-screen pt-topbar-draft nav:pt-draft nav:pl-rail nav:pr-rail-right">
        <main>{page}</main>
        <SiteFooter settings={settings} />
      </div>
    </PageTransitionProvider>
  );
}
