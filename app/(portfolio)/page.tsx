import { Suspense } from "react";
import type { Metadata } from "next";

import CatalogueView from "@/components/catalogue-view";
import CatalogueViewFiltered from "@/components/catalogue-view-filtered";
import { ALL_PIECES } from "@/lib/site";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

/**
 * One address for the archive, whatever it is currently showing.
 *
 * `?filter=` and `?view=` are presentation, not content: every one of them
 * lists the same pieces linking to the same product pages, so they are the same
 * document as far as a crawler is concerned, and left alone each combination
 * would be indexed as a page of its own. Static, and it has to be — reading
 * `searchParams` in `generateMetadata` to build a param-aware canonical would
 * opt the whole route into dynamic rendering, which is the thing the Suspense
 * boundary below exists to avoid.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The portfolio archive — every piece made so far, each commissionable, in
 * whichever of the two arrangements is active. A separate shop for ready-made
 * drops will live on its own route later.
 *
 * Both the category filter and the view are read client-side rather than from
 * `searchParams` here: the filtering was always client-side anyway, and taking
 * either param on the server opted the whole route into dynamic rendering, so
 * the `revalidate` above never actually applied.
 *
 * The Suspense fallback is not a spinner — it is the same archive, unfiltered,
 * in whichever view Site Settings has made the default, and it is what gets
 * prerendered into the HTML. That matters: `useSearchParams` makes React skip
 * prerendering everything under the boundary, so with an empty fallback this
 * page would ship a literally blank `<main>` and every piece, link and price
 * would exist only after hydration. Rendering the default arrangement as the
 * fallback puts the whole catalogue in the static HTML for crawlers and for the
 * first paint; the client then swaps in the resolved view, which is a no-op for
 * the (overwhelmingly common) unfiltered, default-view case.
 */
export default async function PortfolioPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);

  return (
    <Suspense
      fallback={
        <CatalogueView
          products={products}
          view={settings.defaultView}
          filter={ALL_PIECES}
          email={settings.email}
        />
      }
    >
      <CatalogueViewFiltered
        products={products}
        categories={settings.categories}
        defaultView={settings.defaultView}
        email={settings.email}
      />
    </Suspense>
  );
}
