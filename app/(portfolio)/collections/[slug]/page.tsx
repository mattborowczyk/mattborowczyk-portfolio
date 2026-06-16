import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/client";
import { collectionBySlugQuery, allCollectionSlugsQuery } from "@/sanity/lib/queries";
import PieceCard from "@/components/piece-card";
import type { Collection } from "@/sanity/lib/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>({
    query: allCollectionSlugsQuery,
  });
  return slugs?.map(({ slug }) => ({ slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await sanityFetch<Collection>({
    query: collectionBySlugQuery,
    params: { slug },
  });
  return { title: collection?.title ?? "Collection" };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await sanityFetch<Collection>({
    query: collectionBySlugQuery,
    params: { slug },
  });

  if (!collection) notFound();

  return (
    <div className="px-6 py-16 sm:px-12">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-widest uppercase">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-3 mx-auto max-w-md text-stone-500">
            {collection.description}
          </p>
        )}
      </header>

      {collection.pieces?.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.pieces.map((piece) => (
            <PieceCard key={piece._id} piece={piece} />
          ))}
        </div>
      ) : (
        <p className="text-center text-stone-400">No pieces in this collection yet.</p>
      )}
    </div>
  );
}
