import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { sanityFetch } from "@/sanity/lib/client";
import { pieceBySlugQuery, allPieceSlugsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import type { Piece } from "@/sanity/lib/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>({
    query: allPieceSlugsQuery,
  });
  return slugs?.map(({ slug }) => ({ slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = await sanityFetch<Piece>({
    query: pieceBySlugQuery,
    params: { slug },
  });
  if (!piece) return {};
  return {
    title: piece.name,
    description: piece.description,
    openGraph: {
      images: piece.images?.[0]
        ? [urlFor(piece.images[0]).width(1200).url()]
        : [],
    },
  };
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = await sanityFetch<Piece>({
    query: pieceBySlugQuery,
    params: { slug },
  });

  if (!piece) notFound();

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 sm:px-12">
      {/* Image gallery */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {piece.images?.map((img, i) => (
          <div
            key={i}
            className={`relative aspect-square overflow-hidden bg-stone-100 ${
              i === 0 ? "sm:col-span-2 aspect-video" : ""
            }`}
          >
            <Image
              src={urlFor(img).width(1200).url()}
              alt={img.alt ?? piece.name}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{piece.name}</h1>
          {piece.collection && (
            <p className="mt-1 text-sm text-stone-400">
              {piece.collection.title}
            </p>
          )}
          {piece.description && (
            <p className="mt-4 text-stone-600 leading-relaxed">
              {piece.description}
            </p>
          )}
        </div>

        <dl className="space-y-3 text-sm">
          {piece.materials?.map((m) => (
            <div key={m._id}>
              <dt className="font-medium text-stone-400 uppercase tracking-widest text-xs">
                Material
              </dt>
              <dd>{m.name}</dd>
            </div>
          ))}
          {piece.dimensions && (
            <div>
              <dt className="font-medium text-stone-400 uppercase tracking-widest text-xs">
                Dimensions
              </dt>
              <dd>{piece.dimensions}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
