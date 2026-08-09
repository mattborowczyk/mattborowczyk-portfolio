"use client";

import { usePathname } from "next/navigation";

/**
 * Shown on every page while draft mode is on, so an editor is never looking at
 * unpublished content believing it is live — and, more practically, so there is
 * always a way out. Draft mode is a cookie: without an exit it survives tab
 * closes and sticks to the browser indefinitely.
 *
 * A client component only to read the pathname, so "exit" returns to the page
 * the editor was on. And a plain `<a>`, not a `Link`: `/api/draft/disable`
 * clears the cookie and redirects, and a client-side navigation would render
 * from the router cache rather than making the request that does the work.
 */
export default function DraftBanner() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 flex items-center gap-3 bg-ink px-3 py-2 font-mono text-2xs uppercase tracking-wide-md text-bone">
      <span aria-hidden className="text-gold">
        ●
      </span>
      <span>Draft preview</span>
      <a
        href={`/api/draft/disable?redirect=${encodeURIComponent(pathname)}`}
        className="underline underline-offset-2 transition-opacity duration-fast hover:opacity-70"
      >
        Exit
      </a>
    </div>
  );
}
