import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductView from "@/components/product-view";
import { getProduct, getProducts } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ ref: p.ref }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  const result = await getProduct(ref);
  if (!result) return {};
  const { product } = result;
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
  const result = await getProduct(ref);
  if (!result) notFound();

  return <ProductView product={result.product} index={result.index} />;
}
