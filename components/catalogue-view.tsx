"use client";

import CatalogueGrid from "@/components/catalogue-grid";
import CatalogueRun from "@/components/catalogue-run";
import { VIEW_FADE_MS, useViewLeaving } from "@/components/page-transition";
import { type ArchiveView, GRID_VIEW } from "@/lib/site";
import { type Product } from "@/lib/products";

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
 * ── The half of the view transition that lives here ────────────────────────
 *
 * The wrapper below is what fades the arrangement you are leaving. It sits here
 * rather than inside either view because the fade is not a property of the run
 * or of the grid — it is a property of *changing between them*, and neither
 * should have to know the other exists. `page-transition.tsx` owns the other
 * half: it holds the router push back for `VIEW_FADE_MS` so there is something
 * left to fade, which React would otherwise have replaced in the same frame.
 *
 * The transition is declared **only while leaving**, and that asymmetry is the
 * point. On the way out the wrapper fades. On the way back in it snaps to full
 * opacity with no transition at all, so the incoming arrangement's own staggered
 * entry is the only thing animating — put a fade on the wrapper as well and the
 * two multiply, which is how the tiles ended up appearing, disappearing and
 * then appearing again.
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
  const leaving = useViewLeaving();

  return (
    <div
      style={{
        opacity: leaving ? 0 : 1,
        transition: leaving ? `opacity ${VIEW_FADE_MS}ms ease` : "none",
      }}
    >
      {view === GRID_VIEW ? (
        <CatalogueGrid products={products} filter={filter} />
      ) : (
        <CatalogueRun products={products} filter={filter} email={email} />
      )}
    </div>
  );
}
