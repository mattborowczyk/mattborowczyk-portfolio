"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import Eyebrow from "@/components/ui/eyebrow";
import { UnderlineAnchor } from "@/components/ui/underline-link";
import { ALL_PIECES, commissionMailto } from "@/lib/site";
import {
  type Product,
  type ProductMedia,
  altToneFor,
  materialLabel,
  toneFor,
} from "@/lib/products";
import { cn } from "@/lib/utils";

/** `sizes` for a piece at full size; for a minimised one, the 3rem thumbnail. */
const FULL_SIZES = "(min-width: 60rem) 22.5rem, 82vw";
const THUMB_SIZES = "3rem";

/**
 * Name + price row shared by the hover card and the mobile caption. A piece
 * with no price just shows its name — no empty column, no placeholder dash.
 */
function PieceHeading({ name, price }: { name: string; price?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3xs">
      <span className="font-sans text-base font-bold leading-none text-ink">
        {name}
      </span>
      {price && <span className="font-mono text-sm text-ink">{price}</span>}
    </div>
  );
}

/** Overlay cross-fade length — matches `--duration-base` in globals.css. */
const OVERLAY_FADE_MS = 350;

/**
 * The hover overlay when the second media item is a clip.
 *
 * It is mounted only around a hover: a permanently-mounted overlay video would
 * download and decode continuously behind an opacity of 0, for every piece in
 * the run at once. Mounting alone would pop, though — an element that appears
 * already at its final opacity has nothing to transition from, and one removed
 * on mouse-leave never gets to fade out. So it mounts at 0 and is raised a
 * frame later, and the unmount waits out the fade. The result matches the
 * cross-fade an image overlay gets for free.
 */
function OverlayVideo({ item, show }: { item: ProductMedia; show: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [faded, setFaded] = useState(false);

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
    // One frame after mount, so there is a rendered opacity of 0 to animate
    // from rather than a first paint that is already opaque.
    const frame = requestAnimationFrame(() => setFaded(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted, show]);

  if (!mounted) return null;

  return (
    <video
      src={item.url}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-base"
      style={{ opacity: faded ? 1 : 0 }}
    />
  );
}

/**
 * The base clip of a piece. It plays only while the piece is shown at full
 * size: a filtered run would otherwise leave a whole column of thumbnails
 * decoding video at 3rem, which costs far more than it can show. Pausing
 * rather than unmounting keeps the poster frame on screen, so the piece still
 * reads as an image while it is minimised.
 *
 * Three things hold that line, because one is not enough. `autoPlay` is bound
 * to the state rather than always set, so a minimised piece never starts in the
 * first place — an unconditional `autoplay` begins decoding at parse time and
 * the effect below only catches it a paint later, which is precisely the
 * thumbnail column this is meant to avoid. The effect drives the transitions
 * either way. And `onPlay` re-asserts the pause, for playback we did not start:
 * a restore from bfcache, or any of the UA behaviours that resume a muted
 * inline video on their own.
 */
function BaseVideo({ item, playing }: { item: ProductMedia; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <video
      ref={ref}
      src={item.url}
      autoPlay={playing}
      onPlay={(e) => {
        if (!playing) e.currentTarget.pause();
      }}
      loop
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/** One media slot in the run — a still, an animated GIF, or a looping clip. */
function PieceMedia({
  item,
  name,
  sizes = FULL_SIZES,
  overlay = false,
  show = true,
}: {
  item: ProductMedia;
  name: string;
  sizes?: string;
  /** Overlay layers sit above the base still and are decorative. */
  overlay?: boolean;
  show?: boolean;
}) {
  const style = overlay ? { opacity: show ? 1 : 0 } : undefined;
  if (item.kind === "video") {
    if (overlay) return <OverlayVideo item={item} show={show} />;
    return <BaseVideo item={item} playing={show} />;
  }
  return (
    <Image
      src={item.url}
      alt={overlay ? "" : item.alt || name}
      fill
      sizes={sizes}
      aria-hidden={overlay || undefined}
      className="object-cover transition-opacity duration-base"
      // Animated sources are served untransformed; the optimiser would flatten
      // a GIF to a single frame. `animated` comes from the asset's real mime
      // type (see sanity/lib/fetch-data.ts) rather than sniffing the URL.
      unoptimized={item.animated}
      style={style}
    />
  );
}

/**
 * One piece of the run, in either of its two states: shown at full size, or
 * excluded by the active filter and shrunk to a thumbnail in place.
 *
 * The two states are the *same* element, not two components swapped at the
 * filter boundary, and that is what makes the change animatable at all. A swap
 * replaces the DOM node, and a node that appears already at its final size has
 * nothing to transition from — so the run would cut between layouts. Holding
 * one node per `ref` across every filter means the width, the left/right
 * offset, the row spacing and the caption can each simply transition.
 */
function Piece({
  product,
  tone,
  altTone,
  isMatch,
  /** Desktop offset from the centre line; the run alternates side by side. */
  tx,
  cardSide,
  isHover,
  isDwell,
  email,
}: {
  product: Product;
  tone: string;
  altTone: string;
  isMatch: boolean;
  tx: string;
  cardSide: "left" | "right";
  isHover: boolean;
  isDwell: boolean;
  email: string;
}) {
  // `sizes` only ever grows. Landing straight on a filtered URL still asks for
  // the ~3rem derivative for every excluded piece, so the minimised column
  // stays as cheap as it was; but once a piece has been large, it keeps the
  // large `sizes` for good, so shrinking never sends the browser back for a
  // smaller source it is about to need again.
  const [everLarge, setEverLarge] = useState(isMatch);
  useEffect(() => {
    if (isMatch) setEverLarge(true);
  }, [isMatch]);

  return (
    <div
      className="relative max-w-[82%] transition-[width,transform] duration-slow motion-reduce:transition-none nav:translate-x-[var(--tx)]"
      // Width is inline rather than two `w-[…]` classes: which of two
      // arbitrary widths wins is a question of stylesheet order, not of the
      // order they are listed in here.
      style={
        {
          width: isMatch ? "22.5rem" : "3rem",
          "--tx": isMatch ? tx : "0rem",
        } as React.CSSProperties
      }
    >
      {/* Image (click → product) */}
      <Link
        href={`/product/${product.ref}`}
        aria-label={`${product.name} — ${product.type}`}
        className={cn(
          "relative block aspect-[3/4] overflow-hidden transition-[opacity,transform] duration-base motion-reduce:transition-none",
          !isMatch && "opacity-65 hover:scale-[1.06] hover:opacity-100",
        )}
        style={{ backgroundColor: tone }}
      >
        {product.media.length > 0 ? (
          <PieceMedia
            item={product.media[0]}
            name={product.name}
            sizes={everLarge ? FULL_SIZES : THUMB_SIZES}
            show={isMatch}
          />
        ) : (
          <RenderPlaceholder
            tone={tone}
            code={product.ref}
            // The caption does not fit a 3rem box; the reference code alone
            // still identifies the piece.
            caption={isMatch ? undefined : ""}
            className="absolute inset-0"
          />
        )}

        {/* Hover: the second media item if there is one, else the tonal stripe
            the run has always used. Only while the piece is at full size —
            minimised pieces do not take hover, and a mounted overlay image
            would double the requests the thumbnail column costs. */}
        {isMatch &&
          (product.media.length > 1 ? (
            <PieceMedia
              item={product.media[1]}
              name={product.name}
              overlay
              show={isHover}
            />
          ) : (
            <div
              className="render-stripe-45 absolute inset-0 transition-opacity duration-base"
              style={{ backgroundColor: altTone, opacity: isHover ? 1 : 0 }}
              aria-hidden="true"
            />
          ))}
      </Link>

      {/* Info card (desktop, after 500ms dwell) — parked in the margin on the
          side the piece is offset away from. */}
      {isMatch && (
        <div
          className={cn(
            "absolute top-1/2 z-10 hidden w-[var(--hover-card-width)] -translate-y-1/2 flex-col gap-2xs bg-card-veil px-md pb-sm pt-3.5 shadow-card backdrop-blur-sm transition-opacity duration-base nav:flex",
            cardSide === "right"
              ? "left-full ml-[calc(-1*var(--hover-card-overlap))]"
              : "right-full mr-[calc(-1*var(--hover-card-overlap))]",
          )}
          style={{
            opacity: isDwell ? 1 : 0,
            pointerEvents: isDwell ? "auto" : "none",
          }}
        >
          <PieceHeading name={product.name} price={product.price} />
          <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
            {materialLabel(product.material)}
          </div>
          <UnderlineAnchor
            href={commissionMailto(
              email,
              `Commission – ${product.ref} ${product.name}`,
            )}
            className="mt-3xs self-start text-2xs uppercase tracking-wide-md"
          >
            Commission →
          </UnderlineAnchor>
        </div>
      )}

      {/* Caption (mobile, always visible under a full-size piece). The 0fr/1fr
          grid row is the one way to transition to and from "as tall as the
          content is" — an `auto` height is not interpolable, and a max-height
          guess would either clip a two-line name or leave a gap under a
          one-line one. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-slow motion-reduce:transition-none nav:hidden",
          isMatch ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-3 flex flex-col gap-3xs">
            <PieceHeading name={product.name} price={product.price} />
            <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
              {materialLabel(product.material)} · {product.type}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The editorial portfolio "run": a centred vertical column of pieces that
 * alternate left/right, cross-fade to a second tone on hover, and reveal a
 * straddling info card after a 500ms dwell. When a category filter is active,
 * non-matching pieces stay exactly where they are in the column and shrink to
 * thumbnails — the run is one ordered sequence at every filter, and filtering
 * only changes the weight given to each piece, never the order.
 *
 * Because the order never changes and each piece keeps its identity across
 * filters, changing the filter is animated rather than cut: the matched pieces
 * grow out to full width and swing to their side of the centre line while the
 * rest shrink in place. See `Piece`.
 *
 * `filter` is a prop rather than something read from the URL here, so this
 * component never touches `useSearchParams` and can therefore be rendered on
 * the server — see `catalogue-run-filtered.tsx` for why that matters.
 */
export default function CatalogueRun({
  products,
  filter,
  email,
}: {
  products: Product[];
  filter: string;
  email: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [dwelled, setDwelled] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAll = filter === ALL_PIECES;

  // Tone assignment keys off a piece's position in the full run, so it stays
  // stable as filters change. Precomputed — this used to be an indexOf() per
  // row inside the render loop.
  const toneIndex = useMemo(
    () => new Map(products.map((p, i) => [p.ref, i])),
    [products],
  );

  // The left/right zigzag counts only the pieces shown at full size, so the
  // matched run still alternates however the excluded pieces happen to fall
  // between them. Keying it off the position in the whole run instead would
  // let a filter put several matches on the same side.
  const matchedOrder = useMemo(() => {
    const order = new Map<string, number>();
    let n = 0;
    for (const p of products) {
      if (isAll || p.category === filter) order.set(p.ref, n++);
    }
    return order;
  }, [products, isAll, filter]);

  // A filter change can take the hovered piece out from under the cursor, and
  // the mouse handlers only exist while a piece is matched — so the `leave`
  // that would normally clear this never fires. Left alone, the state would
  // still be pointing at that piece the next time a filter brought it back at
  // full size, and it would arrive already showing its hover overlay, or its
  // info card, with the cursor nowhere near it. The pending dwell goes too,
  // otherwise it lands a moment later and re-sets what this just cleared.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setHovered(null);
    setDwelled(null);
  }, [filter]);

  // A pending dwell timer would otherwise fire into an unmounted tree.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function enter(ref: string) {
    setHovered(ref);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDwelled(ref), 500);
  }
  function leave() {
    if (timer.current) clearTimeout(timer.current);
    setHovered(null);
    setDwelled(null);
  }

  return (
    <div className="flex flex-col gap-lg pt-section-lg">
      <Container>
        <Eyebrow size="xs">Collection 01 — Silver &amp; Gold</Eyebrow>
      </Container>

      {/* The rhythm lives on the rows rather than on a container `gap`, because
          the kinds of row need different spacing and a gap can only apply one.
          Three cases, set by the pair rather than by either piece alone:

            full ↔ full        `mt-run`        the run's own rhythm
            full ↔ thumbnail   `mt-run-tight`  60% of it
            thumb ↔ thumb      `mt-sm`         the minimised column closes up

          The middle case used to take the full gap, which left a filtered-out
          thumbnail floating as far from the piece below it as two full pieces
          sit from each other — so the run read as evenly spaced regardless of
          what the filter had done. At 60% the thumbnails visibly belong to the
          gaps between the matches instead of competing with them.

          `mt-run` is exactly the gap the rows used to get from the container,
          so an unfiltered run is laid out identically. The margin transitions
          along with the pieces, so the column closes and opens at the same rate
          as the piece that caused it. */}
      <Container className="flex flex-col">
        {products.map((p, i) => {
          const gi = toneIndex.get(p.ref) ?? 0;
          const isMatch = isAll || p.category === filter;
          const prev = products[i - 1];
          const prevIsMatch = prev && (isAll || prev.category === filter);
          const spacing =
            i === 0
              ? undefined
              : isMatch && prevIsMatch
                ? "mt-run"
                : isMatch || prevIsMatch
                  ? "mt-run-tight"
                  : "mt-sm";

          const mi = matchedOrder.get(p.ref) ?? 0;
          // Alternate the run left/right of centre (desktop only). The info
          // card then goes to the opposite side, where the space is.
          const tx = mi % 2 === 0 ? "-3.25rem" : "3.25rem";

          return (
            <div
              key={p.ref}
              className={cn(
                "flex justify-center transition-[margin-top] duration-slow motion-reduce:transition-none",
                spacing,
              )}
              onMouseEnter={isMatch ? () => enter(p.ref) : undefined}
              onMouseLeave={isMatch ? leave : undefined}
            >
              <Piece
                product={p}
                tone={toneFor(gi)}
                altTone={altToneFor(gi)}
                isMatch={isMatch}
                tx={tx}
                cardSide={mi % 2 === 0 ? "right" : "left"}
                isHover={hovered === p.ref}
                isDwell={dwelled === p.ref}
                email={email}
              />
            </div>
          );
        })}
      </Container>
    </div>
  );
}
