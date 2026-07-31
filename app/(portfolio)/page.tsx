import { Suspense } from "react";

import CatalogueRun from "@/components/catalogue-run";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

/**
 * The portfolio run — every piece made so far, each commissionable. A separate
 * shop for ready-made drops will live on its own route later.
 *
 * The category filter is read client-side in `CatalogueRun` rather than from
 * `searchParams` here: the filtering was always client-side anyway, and taking
 * the param on the server opted the whole route into dynamic rendering, so the
 * `revalidate` above never actually applied. Reading it below a Suspense
 * boundary keeps this page prerendered like every other route.
 */
export default async function PortfolioPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);

  return (
    <Suspense>
      <CatalogueRun
        products={products}
        categories={settings.categories}
        email={settings.email}
      />
    </Suspense>
  );
}
