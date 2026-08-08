import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductView from "@/components/product-view";
import { getProduct, getProducts, getSettings } from "@/sanity/lib/fetch-data";

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
  const title = `${product.name} — ${product.type}`;
  // First still, if the piece has one — a video frame can't serve as an OG card.
  const share = product.media.find((m) => m.kind === "image" && !m.animated);

  return {
    title,
    description: product.description,
    alternates: { canonical: `/product/${encodeURIComponent(product.ref)}` },
    openGraph: {
      title,
      description: product.description,
      type: "article",
      images: share ? [{ url: share.url, alt: share.alt || product.name }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const [result, settings] = await Promise.all([
    getProduct(ref),
    getSettings(),
  ]);
  if (!result) notFound();

  return (
    <ProductView
      product={result.product}
      index={result.index}
      email={settings.email}
    />
  );
}
