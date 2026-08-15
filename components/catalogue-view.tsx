import CatalogueGrid from "@/components/catalogue-grid";
import CatalogueRun from "@/components/catalogue-run";
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
