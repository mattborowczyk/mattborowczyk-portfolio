import CatalogueGrid from "@/components/catalogue-grid";
import CatalogueRun from "@/components/catalogue-run";
import { type ArchiveView, GRID_VIEW } from "@/lib/site";
import { type Product } from "@/lib/products";

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
