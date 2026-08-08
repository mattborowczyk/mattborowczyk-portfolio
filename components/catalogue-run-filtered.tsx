"use client";

import { useSearchParams } from "next/navigation";

import CatalogueRun from "@/components/catalogue-run";
import { type Product } from "@/lib/products";
import { resolveFilter } from "@/lib/site";

/**
 * Applies the `?filter=` param to the run.
 *
 * This exists only to isolate `useSearchParams`. Calling it anywhere inside a
 * statically-rendered route makes React bail the whole subtree up to the
 * nearest Suspense boundary out of prerendering, so whatever sits under that
 * boundary is missing from the served HTML entirely. Keeping the call in this
 * one-line wrapper means the boundary's *fallback* can be a fully
 * server-rendered, unfiltered run — real markup, real product links — while
 * this component swaps in the filtered view once the client takes over.
 *
 * See app/(portfolio)/page.tsx, which pairs the two.
 */
export default function CatalogueRunFiltered({
  products,
  categories,
  email,
}: {
  products: Product[];
  categories: readonly string[];
  email: string;
}) {
  const filter = resolveFilter(categories, useSearchParams().get("filter"));
  return <CatalogueRun products={products} filter={filter} email={email} />;
}
