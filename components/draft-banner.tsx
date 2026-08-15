"use client";

import { usePathname } from "next/navigation";

/**
 * Shown on every page while draft mode is on, so an editor is never looking at
 * unpublished content believing it is live — and, more practically, so there is
 * always a way out. Draft mode is a cookie: without an exit it survives tab
 * closes and sticks to the browser indefinitely.
 *
 * Full-bleed and fixed to the top rather than tucked into a corner, because the
 * failure mode this exists to prevent is *not noticing*. Everything else on the
 * page is bone and ink and quiet; this is the one element allowed to shout. The
 * site chrome moves down by `--draft-offset` to make room — see the Draft
 * banner block in globals.css.
 *
 * A client component only to read the pathname, so "exit" returns to the page
 * the editor was on. And a plain `<a>`, not a `Link`: `/api/draft/disable`
 * clears the cookie and redirects, and a client-side navigation would render
 * from the router cache rather than making the request that does the work.
 */
export default function DraftBanner() {
  const pathname = usePathname();

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex h-draft-banner items-center justify-center gap-3 bg-ink px-4 font-mono text-2xs uppercase tracking-wide-md text-bone"
    >
      <span aria-hidden className="text-gold">
        ●
      </span>
      <span>
        Draft preview
        {/* The qualifier is the useful half but not the load-bearing half, so
            it is what gets dropped rather than wrapped on a narrow screen. */}
        <span className="hidden xs:inline"> — showing unpublished edits</span>
      </span>
      <a
        href={`/api/draft/disable?redirect=${encodeURIComponent(pathname)}`}
        className="border border-bone px-2 py-1 leading-none transition-colors duration-fast hover:bg-bone hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
      >
        Exit
      </a>
    </div>
  );
}
