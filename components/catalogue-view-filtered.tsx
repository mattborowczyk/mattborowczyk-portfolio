"use client";

import { useSearchParams } from "next/navigation";

import CatalogueView from "@/components/catalogue-view";
import { type ArchiveView, resolveFilter, resolveView } from "@/lib/site";
import { type Product } from "@/lib/products";

/**
 * Applies the `?filter=` and `?view=` params to the archive.
 *
 * This exists only to isolate `useSearchParams`. Calling it anywhere inside a
 * statically-rendered route makes React bail the whole subtree up to the
 * nearest Suspense boundary out of prerendering, so whatever sits under that
 * boundary is missing from the served HTML entirely. Keeping the call in this
 * one-line wrapper means the boundary's *fallback* can be a fully
 * server-rendered archive — real markup, real product links — while this
 * component swaps in the filtered view once the client takes over.
 *
 * Both params are read here rather than in two wrappers. They land on the same
 * boundary either way, and splitting them would only mean two components that
 * must be kept in step about what the fallback looks like.
 *
 * See app/(portfolio)/page.tsx, which pairs the two.
 */
export default function CatalogueViewFiltered({
  products,
  categories,
  defaultView,
  email,
}: {
  products: Product[];
  categories: readonly string[];
  defaultView: ArchiveView;
  email: string;
}) {
  const params = useSearchParams();
  return (
    <CatalogueView
      products={products}
      view={resolveView(defaultView, params.get("view"))}
      filter={resolveFilter(categories, params.get("filter"))}
      email={email}
    />
  );
}
