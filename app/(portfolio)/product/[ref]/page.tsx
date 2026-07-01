import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductView from "@/components/product-view";
import { getProduct, products } from "@/lib/products";

export const revalidate = 60; // ISR

export function generateStaticParams() {
  return products.map((p) => ({ ref: p.ref }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  const product = getProduct(ref);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.type}`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  // Phase 3 swaps this for a Sanity fetch with fallback to the seed.
  const product = getProduct(ref);
  if (!product) notFound();

  return <ProductView product={product} />;
}
