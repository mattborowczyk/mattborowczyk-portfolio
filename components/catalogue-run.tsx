"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import PieceMedia, { useHoverCapable } from "@/components/piece-media";
import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import Eyebrow from "@/components/ui/eyebrow";
import { UnderlineAnchor } from "@/components/ui/underline-link";
import { ALL_PIECES, commissionMailto } from "@/lib/site";
import {
  type Product,
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
  isLead,
  canHover,
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
  /** First piece shown at full size — the one the run opens on. */
  isLead: boolean;
  canHover: boolean;
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
          "focus-ring relative block aspect-[3/4] overflow-hidden transition-[opacity,transform] duration-base motion-reduce:transition-none",
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
            // A clip here now runs only while the piece is pointed at or
            // focused, where it used to run from the moment the piece was at
            // full size. That is WCAG 2.2.2 (Level A): moving content which
            // starts on its own and lasts more than five seconds owes the
            // visitor a way to pause, stop or hide it — and a looping clip has
            // no end, so it always does. There is nowhere to put a pause
            // control here: the clip is inside the link to the piece, and a
            // button inside a link is not a thing a browser can resolve.
            //
            // Starting it on hover or focus removes the obligation rather than
            // satisfying it, because content the visitor started is not content
            // that started automatically — and it is the same gesture the
            // second-media overlay above has always used, so the run behaves
            // one way rather than two. `isHover` is raised by `reveal` on focus
            // as well as by the mouse, so this is reachable from the keyboard.
            //
            // The cost, stated plainly: on a touch screen there is no hover, so
            // a clip in the run shows its poster and nothing else. Tapping goes
            // to the piece's own page, where it plays — with a pause control.
            playing={isMatch && isHover}
            // The lead piece is the largest thing in the opening viewport and
            // therefore the LCP element on the catalogue. Left to the default
            // it is `loading="lazy"` like every other piece in the run, which
            // costs it a whole round of discovery: the browser will not even
            // request it until layout has run. Marked priority it is preloaded
            // from the document head instead. Only the lead — the pieces below
            // it stay lazy, which is the other half of the same trade.
            priority={isLead}
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
            would double the requests the thumbnail column costs.

            And only where there is a cursor to hover with. On a touch screen
            this layer can never be seen, but it is still a second full-size
            image per piece, fetched as soon as the piece nears the viewport —
            it was doubling the catalogue's image bytes on precisely the devices
            least able to afford them. `canHover` is false through the server
            render and the hydration that follows it, so the overlay is absent
            from the HTML on every device and pointer-capable ones add it a beat
            later; a hover cannot arrive before then. */}
        {isMatch &&
          canHover &&
          (product.media.length > 1 ? (
            <PieceMedia
              item={product.media[1]}
              name={product.name}
              sizes={FULL_SIZES}
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
          side the piece is offset away from.

          `isDwell` is now raised by keyboard focus as well as by dwell — see
          `reveal` in the run below — and that is a fix rather than a flourish.
          The card holds a `Commission →` link, and the card is only ever
          *visually* hidden, so tabbing the archive used to alternate between a
          piece and an invisible link, one per piece, with the focus ring faded
          out along with everything else. Nothing told a keyboard user where
          they were, roughly twenty times a page.

          Note what this is deliberately *not*: `group-focus-within` classes on
          this element. That reads better and does not work — Tailwind wraps
          the group in `:where()`, so `group-focus-within:opacity-100` carries
          the same specificity as the `opacity-0` it has to beat and the winner
          comes down to which one the stylesheet happens to emit last. It lost.
          One state, one class, no cascade to arbitrate. */}
      {isMatch && (
        <div
          className={cn(
            "absolute top-1/2 z-10 hidden w-[var(--hover-card-width)] -translate-y-1/2 flex-col gap-2xs bg-card-veil px-md pb-sm pt-3.5 shadow-card backdrop-blur-sm transition-opacity duration-base nav:flex",
            isDwell ? "opacity-100" : "pointer-events-none opacity-0",
            cardSide === "right"
              ? "left-full ml-[calc(-1*var(--hover-card-overlap))]"
              : "right-full mr-[calc(-1*var(--hover-card-overlap))]",
          )}
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
  const canHover = useHoverCapable();

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

  /**
   * The same reveal, reached by keyboard, and immediate.
   *
   * The card is what the run says about a piece — its name, its price, what it
   * is made of, and the link to commission it — and until this existed the only
   * way to be told any of it was to hold a cursor still over the piece for half
   * a second. Tabbing to the piece produced nothing, and then tabbing again put
   * focus on the commission link *inside* the invisible card.
   *
   * No dwell delay here on purpose. The 500ms exists so that sweeping a mouse
   * down the column doesn't flash a card at every piece it crosses; a keyboard
   * arrives one piece at a time, deliberately, and there is nothing to debounce.
   */
  function reveal(ref: string) {
    if (timer.current) clearTimeout(timer.current);
    setHovered(ref);
    setDwelled(ref);
  }

  return (
    <div className="flex flex-col gap-lg">
      <Container>
        {/* The archive's `<h1>`. The page had no heading of any level — the
            landing page of the site was a run of images with nothing above
            them — and this line is already the thing that names what follows,
            so it becomes the heading rather than a hidden one being invented
            beside it. `Eyebrow` renders whatever element it is told to; the
            styling is untouched. */}
        <Eyebrow as="h1" size="xs">
          Collection 01 — Silver &amp; Gold
        </Eyebrow>
      </Container>

      {/* The rhythm lives on the rows rather than on a container `gap`, because
          the kinds of row need different spacing and a gap can only apply one.
          Two cases now, set by the pair rather than by either piece alone:

            full ↔ full        `mt-run`  the run's own rhythm
            anything ↔ thumb   `mt-sm`   the minimised column closes up

          The second case used to be split in two, with a full↔thumb seam at
          60% of the run and thumb↔thumb tighter still. That made the ends of a
          minimised stretch wider than its middle, so the thumbnails read as
          belonging to the pieces either side rather than to each other. One
          value for every gap that touches a thumbnail closes the whole stretch
          into a single block.

          The margin transitions along with the pieces, so the column closes and
          opens at the same rate as the piece that caused it. */}
      <Container className="flex flex-col">
        {products.map((p, i) => {
          const gi = toneIndex.get(p.ref) ?? 0;
          const isMatch = isAll || p.category === filter;
          const prev = products[i - 1];
          const prevIsMatch = prev && (isAll || prev.category === filter);
          const spacing =
            i === 0 ? undefined : isMatch && prevIsMatch ? "mt-run" : "mt-sm";

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
              // React's onFocus/onBlur are focusin/focusout underneath, so
              // they catch focus landing on anything inside the piece — the
              // image link or the commission link in the card — and clear
              // again when it leaves for a different piece.
              //
              // The `relatedTarget` check is what keeps the second of those
              // two reachable: tabbing from the image to the commission link
              // is a focusout and a focusin on the same row, and clearing on
              // the way out would take the card down and put it straight back
              // up around the link being tabbed to. Focus leaving the document
              // has no relatedTarget, which is outside the row, so that still
              // clears.
              onFocus={isMatch ? () => reveal(p.ref) : undefined}
              onBlur={
                isMatch
                  ? (e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) leave();
                    }
                  : undefined
              }
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
                isLead={isMatch && mi === 0}
                canHover={canHover}
              />
            </div>
          );
        })}
      </Container>
    </div>
  );
}
