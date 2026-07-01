import CatalogueRun from "@/components/catalogue-run";
import { getProducts, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export default async function CataloguePage({
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
    raw && settings.categories.includes(raw) ? raw : "Shop all";

  return (
    <CatalogueRun products={products} filter={filter} email={settings.email} />
  );
}
