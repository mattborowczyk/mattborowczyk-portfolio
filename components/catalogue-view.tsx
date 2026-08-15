import dynamic from "next/dynamic";

import CatalogueRun from "@/components/catalogue-run";
import { type ArchiveView, GRID_VIEW } from "@/lib/site";
import { type Product } from "@/lib/products";

/**
 * The grid, fetched only by a visitor who is actually looking at it.
 *
 * This is a measured decision, not a precaution. Imported statically, the grid
 * landed in the same client chunk as the run, so every visit to `/` in column
 * view downloaded it, parsed it, and ran its module initialisation — which
 * includes building all five compositions from their pictures in
 * `lib/grid-pattern.ts`. On a throttled phone that took the archive from 97 to
 * 91, TBT from 0 to 70ms and LCP from 2.7s to 3.4s: the whole cost of a feature
 * that route was not using.
 *
 * `ssr` is left on. The default arrangement is a Site Settings field, so the
 * grid can be what a bare `/` prerenders — turning SSR off would make that
 * configuration ship an empty page to a crawler.
 *
 * What it costs is a chunk fetch on the first switch to the grid, during which
 * `loading` renders nothing. That is deliberate: a spinner for a local chunk
 * that arrives in a few frames is more disruptive than the gap, the outgoing
 * arrangement is dissolving over it, and every later switch is cached.
 */
const CatalogueGrid = dynamic(() => import("@/components/catalogue-grid"), {
  loading: () => null,
});

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
 * `view` and `filter` both arrive as props rather than being read here, so this
 * never touches `useSearchParams` and can therefore be server-rendered. See
 * `catalogue-view-filtered.tsx` for the half that does read them, and why the
 * two are separate.
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
  if (view === GRID_VIEW) {
    return <CatalogueGrid products={products} filter={filter} />;
  }
  return <CatalogueRun products={products} filter={filter} email={email} />;
}
