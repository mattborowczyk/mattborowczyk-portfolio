import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { Piece } from "@/sanity/lib/queries";

export default function PieceCard({ piece }: { piece: Piece }) {
  return (
    <Link
      href={`/work/${piece.slug}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {piece.image ? (
          <Image
            src={urlFor(piece.image).width(600).height(600).url()}
            alt={piece.image.alt ?? piece.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            No image
          </div>
        )}

        {/* Status badge */}
        {piece.status && piece.status !== "portfolio" && (
          <span className="absolute bottom-3 left-3 bg-white px-2 py-1 text-xs tracking-widest uppercase">
            {piece.status === "for_sale"
              ? "Available"
              : piece.status === "sold"
              ? "Sold"
              : "Commission"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-3">
        <p className="text-sm tracking-wide">{piece.name}</p>
        {piece.collection && (
          <p className="mt-0.5 text-xs text-stone-400">
            {piece.collection.title}
          </p>
        )}
      </div>
    </Link>
  );
}
