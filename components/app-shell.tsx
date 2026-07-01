"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";

/**
 * Wraps every portfolio page and decides the frame per route:
 * - /links    → bare full-screen (the page centres itself; no rail/footer)
 * - /product  → full-bleed (no rail), footer below
 * - otherwise → fixed rail (desktop) / top bar (mobile), offset content + footer
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/links") {
    return <main className="min-h-screen">{children}</main>;
  }

  if (pathname.startsWith("/product")) {
    return (
      <>
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Suspense
        fallback={<div className="fixed left-0 top-0 h-screen w-[206px] bg-bone" />}
      >
        <SiteNav />
      </Suspense>
      <div className="min-h-screen pt-[116px] nav:pt-0 nav:pl-[206px]">
        <main>{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
