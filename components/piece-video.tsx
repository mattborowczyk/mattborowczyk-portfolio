"use client";

import { useEffect, useRef, useState } from "react";

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
 * Two questions, and they are not the same one.
 *
 * `prefers-reduced-motion` decides whether the clip should start at all. The
 * hook answers `true` until it has read the query, so the server-rendered
 * markup carries no `autoplay` and the clip cannot begin before the preference
 * is known — the window in which a reduced-motion visitor would otherwise be
 * shown exactly the motion they asked not to see. See lib/use-reduced-motion.
 *
 * The pause control answers WCAG 2.2.2 (Level A), which is owed to *everyone*
 * and not only to that preference: content that moves, starts by itself and
 * runs for more than five seconds has to come with a way to stop it, and a clip
 * that loops never ends on its own. The catalogue solves this by not starting
 * automatically at all — a clip in the run waits for a hover or a focus — but
 * here the clip is the piece rather than a thumbnail of it, so it plays, and
 * gets a control instead.
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
  // Null while the visitor has not expressed a view, which is what lets the
  // preference decide; once they press the button it holds their answer, and
  // theirs outranks the preference in both directions — someone who asked for
  // less motion may still want to watch this one clip.
  const [wanted, setWanted] = useState<boolean | null>(null);
  const playing = wanted ?? !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
    // `item.url` as well as the decision: swapping the source under a mounted
    // element restarts the media load algorithm, and the decision this effect
    // made about the previous clip does not carry across it.
  }, [playing, item.url]);

  return (
    <>
      <video
        ref={ref}
        src={item.url}
        poster={item.poster}
        autoPlay={playing}
        onPlay={(e) => {
          if (!playing) e.currentTarget.pause();
        }}
        loop
        muted
        playsInline
        aria-label={item.alt || name}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {/* Sits in the corner of the frame rather than over the piece, on the
          same translucent card the run's info card uses, so it reads as part of
          the chrome and not as part of the object being photographed. The label
          is the action, which is what a screen reader should hear; the glyph is
          decorative and hidden from it. */}
      <button
        type="button"
        onClick={() => setWanted(!playing)}
        aria-label={playing ? "Pause clip" : "Play clip"}
        className="focus-ring absolute bottom-3 left-3 z-10 flex h-8 min-w-8 items-center justify-center bg-card-veil px-2 font-mono text-2xs uppercase tracking-wide-md text-ink backdrop-blur-sm transition-colors hover:bg-card"
      >
        <span aria-hidden="true">{playing ? "❙❙" : "▶"}</span>
      </button>
    </>
  );
}
