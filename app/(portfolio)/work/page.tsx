import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { allPiecesQuery } from "@/sanity/lib/queries";
import PieceCard from "@/components/piece-card";
import type { Piece } from "@/sanity/lib/queries";

export const metadata: Metadata = { title: "Work" };
export const revalidate = 60;

export default async function WorkPage() {
  const pieces = await sanityFetch<Piece[]>({ query: allPiecesQuery });

  return (
    <div className="px-6 py-16 sm:px-12">
      <h1 className="mb-12 text-center text-xs tracking-widest uppercase text-stone-400">
        All Work
      </h1>

      {pieces?.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((piece) => (
            <PieceCard key={piece._id} piece={piece} />
          ))}
        </div>
      ) : (
        <p className="text-center text-stone-400">No pieces yet.</p>
      )}
    </div>
  );
}
