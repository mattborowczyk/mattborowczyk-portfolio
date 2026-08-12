"use client";

import { useEffect, useRef } from "react";

import type { ProductMedia } from "@/lib/products";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * A piece's clip on the product page: full frame, looping, silent.
 *
 * Its own client component so that `product-view.tsx` stays a server component
 * with no state — the file says as much at the top, and the media run is the
 * only thing in it that needs to ask the browser a question. A page whose
 * piece has no clip pays nothing for this: nothing renders it.
 *
 * The question is `prefers-reduced-motion`. A silent loop with no controls is
 * moving content that starts by itself and never stops, and the product page
 * gives it the whole column — so a visitor who has asked for less motion gets
 * the poster frame held still instead. `autoPlay` is bound to the same answer
 * rather than always set, so the clip is never started and then stopped; the
 * effect covers the live case, where the preference changes under a page that
 * is already open, and any UA that resumes a muted inline video on its own.
 */
export default function PieceVideo({
  item,
  name,
}: {
  item: ProductMedia;
  name: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) el.pause();
    else void el.play().catch(() => {});
  }, [reduced]);

  return (
    <video
      ref={ref}
      src={item.url}
      poster={item.poster}
      autoPlay={!reduced}
      onPlay={(e) => {
        if (reduced) e.currentTarget.pause();
      }}
      loop
      muted
      playsInline
      aria-label={item.alt || name}
      className="absolute inset-0 h-full w-full object-contain"
    />
  );
}
