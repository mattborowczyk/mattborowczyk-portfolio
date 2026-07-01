import CatalogueRun from "@/components/catalogue-run";
import { categories } from "@/lib/site";
import { products } from "@/lib/products";

export const revalidate = 60; // ISR

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const filter =
    raw && (categories as readonly string[]).includes(raw) ? raw : "Shop all";

  // Phase 3 swaps `products` for a Sanity fetch with fallback to this seed.
  return <CatalogueRun products={products} filter={filter} />;
}
