import { Suspense } from "react";

import CatalogueRun from "@/components/catalogue-run";
import CatalogueRunFiltered from "@/components/catalogue-run-filtered";
import { ALL_PIECES } from "@/lib/site";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

/**
 * The portfolio run — every piece made so far, each commissionable. A separate
 * shop for ready-made drops will live on its own route later.
 *
 * The category filter is read client-side rather than from `searchParams` here:
 * the filtering was always client-side anyway, and taking the param on the
 * server opted the whole route into dynamic rendering, so the `revalidate`
 * above never actually applied.
 *
 * The Suspense fallback is not a spinner — it is the same run, unfiltered, and
 * it is what gets prerendered into the HTML. That matters: `useSearchParams`
 * makes React skip prerendering everything under the boundary, so with an empty
 * fallback this page would ship a literally blank `<main>` and every piece,
 * link and price would exist only after hydration. Rendering the unfiltered run
 * as the fallback puts the whole catalogue in the static HTML for crawlers and
 * for the first paint; the client then swaps in the filtered view, which is a
 * no-op for the (overwhelmingly common) unfiltered case.
 */
export default async function PortfolioPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);

  return (
    <Suspense
      fallback={
        <CatalogueRun
          products={products}
          filter={ALL_PIECES}
          email={settings.email}
        />
      }
    >
      <CatalogueRunFiltered
        products={products}
        categories={settings.categories}
        email={settings.email}
      />
    </Suspense>
  );
}
