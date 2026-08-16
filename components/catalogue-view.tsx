"use client";

import { useEffect, useState } from "react";

import CatalogueGrid from "@/components/catalogue-grid";
import CatalogueRun from "@/components/catalogue-run";
import { type ArchiveView, GRID_VIEW } from "@/lib/site";
import { type Product } from "@/lib/products";

/**
 * How long the outgoing arrangement fades before the other one replaces it.
 *
 * Much shorter than a route change. This is not a journey between pages — it is
 * the same pieces rearranging, and the visitor asked for it by clicking a
 * toggle, so every millisecond here is latency they can feel.
 */
const VIEW_FADE_MS = 220;

/**
 * A note on `next/dynamic`, which this deliberately does **not** use.
 *
 * Code-splitting the grid looks obviously right — the column view has no need
 * of it — and it was tried. It is actively harmful here, for a reason specific
 * to this page: the arrangement can be what `/` prerenders, so the server sends
 * the grid's markup, and then hydration has no chunk for it yet and renders the
 * `loading` state instead. The grid vanishes and comes back a moment later. In
 * a Lighthouse run that showed up as the whole page shifting (CLS 0.13 on a
 * route that is otherwise 0) and as an LCP whose image had arrived in 69ms and
 * then waited 2.6s to paint, because the element that finally counted was the
 * second one, built after the chunk landed.
 *
 * The regression it was meant to solve turned out not to exist — it was
 * measured against a stale server that had outlived its build. Statically
 * imported, `/` measures better than `main` does. What is worth keeping from
 * that detour is in `lib/grid-pattern.ts`: the compositions are built on first
 * use rather than at module load, so importing this module costs nothing until
 * a grid is actually drawn.
 */

/**
 * The archive, in whichever arrangement is active.
 *
 * Deliberately a plain switch and not a component that owns both: the two views
 * share their data and nothing else. The run is a single ordered column that
 * filters by shrinking pieces in place; the grid is a lattice that filters by
 * removing them and closing the gaps. Trying to express both as one component
 * produced something that was mostly branches, and the parts that were shared —
 * the media rendering, the hover rules, the ordering — are shared as modules
 * instead, where they can be shared without being entangled.
 *
 * ── Why the whole view transition lives here ───────────────────────────────
 *
 * This component renders one arrangement behind the other, so `view` changing
 * is not immediately obeyed: the arrangement already on screen keeps rendering
 * while it fades, and only then does the other one take its place.
 *
 * It used to be split in two — the router push held back in
 * `page-transition.tsx` while a flag there drove the fade — and that split was
 * the bug. Clearing the flag and pushing are two separate state changes, and
 * React commits the first without waiting for the router to render the second,
 * so for a frame or two the wrapper was back at full opacity while it still
 * held the *old* arrangement. The outgoing view flashed back into view right
 * before being replaced, which is the one thing a cross-fade must not do.
 *
 * Swapping and un-fading in the same `setTimeout` makes them one commit. There
 * is no window between them for anything to be seen in.
 *
 * The scroll comes with the swap for the same reason. The two arrangements
 * differ in height by roughly ten to one, so there is no position worth
 * preserving; doing it here means it happens at the moment the page is at
 * opacity 0, and nobody sees it move.
 *
 * `view` and `filter` arrive as props rather than being read here, so this
 * never touches `useSearchParams`. See `catalogue-view-filtered.tsx`.
 */
export default function CatalogueView({
  products,
  view,
  filter,
  email,
}: {
  products: Product[];
  view: ArchiveView;
  filter: string;
  email: string;
}) {
  // The arrangement actually on screen, which lags `view` by one fade.
  const [shown, setShown] = useState(view);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (view === shown) {
      // Not merely an early return. Changing your mind mid-fade — clicking the
      // toggle and clicking straight back — cancels the timeout below before it
      // can swap anything, and lands here with `view` already equal to `shown`.
      // Without this the fade is never called off and the archive stays at
      // opacity 0 for good. A no-op when it is already false.
      setFading(false);
      return;
    }
    setFading(true);
    const swap = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      setShown(view);
      setFading(false);
    }, VIEW_FADE_MS);
    return () => clearTimeout(swap);
  }, [view, shown]);

  return (
    <div
      style={{
        opacity: fading ? 0 : 1,
        // Declared only while leaving. On the way back in the wrapper snaps to
        // full opacity with no transition at all, so the incoming arrangement's
        // own staggered entry is the only thing animating — put a fade here too
        // and the two multiply, which is what made the tiles appear, disappear
        // and appear again.
        transition: fading ? `opacity ${VIEW_FADE_MS}ms ease` : "none",
      }}
    >
      {shown === GRID_VIEW ? (
        <CatalogueGrid products={products} filter={filter} />
      ) : (
        <CatalogueRun products={products} filter={filter} email={email} />
      )}
    </div>
  );
}
