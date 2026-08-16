"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { type ProductMedia } from "@/lib/products";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Rendering one media slot of a piece — a still, an animated GIF, or a looping
 * clip — wherever a piece appears.
 *
 * Extracted from the catalogue run when the grid arrived, not rewritten: every
 * decision below was made against a measured problem in the run, and the grid
 * shows far more pieces at once than the run does, so all of them apply harder
 * there. Duplicating it would have meant two copies of the autoplay rules
 * drifting apart, and the failure mode of that drift is silent — a clip that
 * quietly starts playing on its own in one view and not the other.
 */

/** Overlay cross-fade length — matches `--duration-base` in globals.css. */
export const OVERLAY_FADE_MS = 350;

/**
 * Whether this visitor has a pointer that can hover at all.
 *
 * A media query and not a touch-events sniff, because the question is about the
 * input device rather than the browser: a laptop with a touchscreen has both,
 * and answering "touch" for it would take the hover states away from a mouse
 * that is right there. It is also live — a tablet gaining a trackpad flips it —
 * so nothing has to be reloaded to get its hover states back.
 *
 * Starts false rather than reading `matchMedia` in the initialiser: there is no
 * `window` during the server render, and a client that disagreed with the HTML
 * on the first pass would be a hydration mismatch.
 */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(query.matches);
    const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return canHover;
}

/**
 * Where the image is anchored when the frame it is drawn in is a different
 * shape from the photograph.
 *
 * `object-fit: cover` crops from the centre and knows nothing about the CMS, so
 * without this a ring photographed high in its frame simply lost its top edge —
 * and the hotspot control in the Studio appeared to do nothing at all. The grid
 * makes this much more visible than the run did, because a slot's ratio is set
 * by the composition rather than by the photograph.
 *
 * Undefined when no hotspot is set, so the CSS default (centre) applies rather
 * than a hard-coded 50% that would have to be kept in step with it.
 */
function objectPosition(item: ProductMedia): string | undefined {
  if (!item.focus) return undefined;
  return `${item.focus.x * 100}% ${item.focus.y * 100}%`;
}

/**
 * The hover overlay when the second media item is a clip.
 *
 * It is mounted only around a hover: a permanently-mounted overlay video would
 * download and decode continuously behind an opacity of 0, for every piece on
 * screen at once. Mounting alone would pop, though — an element that appears
 * already at its final opacity has nothing to transition from, and one removed
 * on mouse-leave never gets to fade out. So it mounts at 0 and is raised a
 * frame later, and the unmount waits out the fade. The result matches the
 * cross-fade an image overlay gets for free.
 */
function OverlayVideo({ item, show }: { item: ProductMedia; show: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [faded, setFaded] = useState(false);
  // The same rule `BaseVideo` keeps, and for the same reason: a loop with no
  // end and no pause control is motion a visitor has asked not to be given.
  // Hover starting it does not change that — the overlay is a second view of
  // the piece, and the poster is that view held still. The fade below is
  // unaffected; a reduced-motion visitor gets the cross-fade and a frozen
  // frame instead of the cross-fade and a loop.
  const reduced = useReducedMotion();

  useEffect(() => {
    if (show) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timer = setTimeout(() => setMounted(false), OVERLAY_FADE_MS);
    return () => clearTimeout(timer);
  }, [show, mounted]);

  useEffect(() => {
    if (!mounted || !show) {
      setFaded(false);
      return;
    }
    // Two frames after mount, so there is a *painted* opacity of 0 to animate
    // from rather than a first paint that is already opaque. One is not enough:
    // a rAF callback runs before the paint it is queued ahead of, so the state
    // it sets can be committed into that very same paint — the element would
    // then first appear at opacity 1 and there would be nothing to transition.
    // The second frame is what puts a rendered 0 on screen first.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setFaded(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [mounted, show]);

  if (!mounted) return null;

  return (
    <video
      src={item.url}
      poster={item.poster}
      autoPlay={!reduced}
      // Re-asserted for playback we did not start — a UA resuming a muted
      // inline video on its own, as in `BaseVideo`.
      onPlay={(e) => {
        if (reduced) e.currentTarget.pause();
      }}
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-base"
      style={{ opacity: faded ? 1 : 0, objectPosition: objectPosition(item) }}
    />
  );
}

/**
 * The base clip of a piece. It plays only while the piece is being pointed at
 * or focused — see the note at the `playing` prop, which is WCAG rather than
 * taste — and never while the piece is minimised: a filtered run would
 * otherwise leave a whole column of thumbnails decoding video at 3rem, which
 * costs far more than it can show. Pausing rather than unmounting keeps the
 * poster frame on screen, so the piece still reads as an image while it is
 * paused.
 *
 * Three things hold that line, because one is not enough. `autoPlay` is bound
 * to the state rather than always set, so a paused piece never starts in the
 * first place — an unconditional `autoplay` begins decoding at parse time and
 * the effect below only catches it a paint later, which is precisely the
 * thumbnail column this is meant to avoid. The effect drives the transitions
 * either way. And `onPlay` re-asserts the pause, for playback we did not start:
 * a restore from bfcache, or any of the UA behaviours that resume a muted
 * inline video on their own.
 */
function BaseVideo({
  item,
  playing: shouldPlay,
  priority,
}: {
  item: ProductMedia;
  playing: boolean;
  priority: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  // A clip that loops forever is moving content that starts on its own and does
  // not stop, and there is no pause control on a catalogue tile to offer
  // instead. So a visitor who has asked for less motion gets the poster frame
  // and nothing else — which is what the piece looks like at rest anyway.
  // Folded into `playing` so the effect, `autoPlay` and the `onPlay` re-assert
  // below all continue to agree with each other.
  //
  // `useReducedMotion` reports `true` until it has actually read the query, so
  // nothing plays while the answer is still unknown — including through the
  // server render and the hydration that follows it. See the hook.
  const reduced = useReducedMotion();
  const playing = shouldPlay && !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <>
      {/* The lead piece can be a clip, and `priority` used to stop dead at the
          image branch — so the one piece a view opens on got no head start at
          all when it happened to be a video. What paints for a clip is its
          poster, so that is what gets the treatment: preloaded from the head,
          at the priority `next/image` would have given the still it stands in
          for. React hoists and dedupes this by href.

          Deliberately *not* `preload="auto"` on the video below. That would
          pull the whole clip eagerly, which is a great many bytes spent to
          paint a frame the poster has already painted — the opposite of the
          trade the rest of this file makes. */}
      {priority && item.poster && (
        <link
          rel="preload"
          as="image"
          href={item.poster}
          fetchPriority="high"
        />
      )}
      <video
        ref={ref}
        src={item.url}
        // A piece that never starts its clip shows the poster and nothing else;
        // one that has played is paused on a real frame and the poster has
        // already done its job.
        poster={item.poster}
        autoPlay={playing}
        onPlay={(e) => {
          if (!playing) e.currentTarget.pause();
        }}
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: objectPosition(item) }}
      />
    </>
  );
}

/** One media slot — a still, an animated GIF, or a looping clip. */
export default function PieceMedia({
  item,
  name,
  sizes,
  overlay = false,
  show = true,
  playing = show,
  priority = false,
}: {
  item: ProductMedia;
  name: string;
  sizes: string;
  /** Overlay layers sit above the base still and are decorative. */
  overlay?: boolean;
  show?: boolean;
  /**
   * Whether a clip in this slot may run.
   *
   * Separate from `show` because the two questions came apart: `show` is about
   * whether the piece is being drawn at all, while this is about whether motion
   * has been asked for. Callers bind it to hover or focus, and that is WCAG
   * 2.2.2 (Level A) rather than a flourish — moving content that starts on its
   * own and lasts more than five seconds owes the visitor a way to pause, stop
   * or hide it, and a looping clip has no end, so it always does. There is
   * nowhere to put a pause control: the clip is inside the link to the piece,
   * and a button inside a link is not a thing a browser can resolve. Starting
   * it on hover or focus removes the obligation rather than satisfying it,
   * because content the visitor started is not content that started
   * automatically.
   *
   * The cost, stated plainly: on a touch screen there is no hover, so a clip in
   * the catalogue shows its poster and nothing else. Tapping goes to the
   * piece's own page, where it plays — with a pause control.
   */
  playing?: boolean;
  /** The one piece that opens above the fold. */
  priority?: boolean;
}) {
  if (item.kind === "video") {
    // Overlays are hover-only and so never the lead; `priority` is the base
    // layer's business alone.
    if (overlay) return <OverlayVideo item={item} show={show} />;
    return <BaseVideo item={item} playing={playing} priority={priority} />;
  }
  return (
    <Image
      src={item.url}
      alt={overlay ? "" : item.alt || name}
      fill
      sizes={sizes}
      priority={priority}
      aria-hidden={overlay || undefined}
      className="object-cover transition-opacity duration-base"
      // Animated sources are served untransformed; the optimiser would flatten
      // a GIF to a single frame. `animated` comes from the asset's real mime
      // type (see sanity/lib/fetch-data.ts) rather than sniffing the URL.
      unoptimized={item.animated}
      style={{
        objectPosition: objectPosition(item),
        ...(overlay && { opacity: show ? 1 : 0 }),
      }}
    />
  );
}
