"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

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
 */
export default function AppShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();

  if (pathname === "/links") {
    return <main className="min-h-screen">{children}</main>;
  }

  if (pathname.startsWith("/product")) {
    return (
      <>
        <main className="min-h-screen">{children}</main>
        <SiteFooter settings={settings} />
      </>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <>
            <div className="fixed left-0 top-0 h-screen w-rail bg-bone" />
            <div className="fixed right-0 top-0 h-screen w-rail-right bg-bone" />
          </>
        }
      >
        <SiteNav settings={settings} />
      </Suspense>
      <div className="min-h-screen pt-topbar nav:pt-0 nav:pl-rail nav:pr-rail-right">
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </>
  );
}
