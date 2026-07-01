"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import SiteNav from "@/components/site-nav";

/**
 * Wraps every portfolio page. On the product route the rail is hidden and
 * content runs full-width (the piece owns the screen); elsewhere the content
 * is offset for the fixed rail (desktop) / top bar (mobile).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = pathname.startsWith("/product");

  if (fullBleed) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Suspense fallback={<div className="fixed left-0 top-0 h-screen w-[206px] bg-bone" />}>
        <SiteNav />
      </Suspense>
      <main className="min-h-screen pt-[116px] nav:pt-0 nav:pl-[206px]">
        {children}
      </main>
    </>
  );
}
