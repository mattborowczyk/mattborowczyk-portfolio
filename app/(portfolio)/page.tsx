import CatalogueRun from "@/components/catalogue-run";
import { ALL_PIECES } from "@/lib/site";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

/**
 * The portfolio run — every piece made so far, each commissionable. A separate
 * shop for ready-made drops will live on its own route later.
 */
export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);
  const filter =
    raw && settings.categories.includes(raw) ? raw : ALL_PIECES;

  return (
    <CatalogueRun products={products} filter={filter} email={settings.email} />
  );
}
