import { sanityFetch } from "@/sanity/lib/client";
import { featuredPiecesQuery, settingsQuery } from "@/sanity/lib/queries";
import PieceCard from "@/components/piece-card";
import NewsletterForm from "@/components/newsletter-form";
import type { Piece, Settings } from "@/sanity/lib/queries";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const [pieces, settings] = await Promise.all([
    sanityFetch<Piece[]>({ query: featuredPiecesQuery }),
    sanityFetch<Settings>({ query: settingsQuery }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-light tracking-widest uppercase sm:text-6xl">
          {settings?.siteTitle ?? "Mateusz Borowczyk"}
        </h1>
        <p className="mt-4 max-w-md text-stone-500">
          {settings?.tagline ?? "Handcrafted jewellery"}
        </p>
        <a
          href="/work"
          className="mt-8 border border-stone-900 px-8 py-3 text-sm tracking-widest uppercase transition hover:bg-stone-900 hover:text-white"
        >
          View Work
        </a>
      </section>

      {/* Featured pieces */}
      {pieces?.length > 0 && (
        <section className="px-6 py-16 sm:px-12">
          <h2 className="mb-10 text-center text-xs tracking-widest uppercase text-stone-400">
            Selected Work
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pieces.map((piece) => (
              <PieceCard key={piece._id} piece={piece} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-stone-200 px-6 py-16 text-center">
        <h2 className="mb-2 text-lg font-light tracking-widest uppercase">
          {settings?.newsletterTitle ?? "Stay in the loop"}
        </h2>
        <p className="mb-6 text-sm text-stone-500">
          {settings?.newsletterSubtitle ??
            "New pieces, collections, and upcoming courses — delivered occasionally."}
        </p>
        <NewsletterForm />
      </section>
    </>
  );
}
