"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import PieceMedia, { useHoverCapable } from "@/components/piece-media";
import RenderPlaceholder from "@/components/render-placeholder";
import Eyebrow from "@/components/ui/eyebrow";
import {
  consumeViewChange,
  usePageLeavingHref,
} from "@/components/page-transition";
import {
  type GridPlacement,
  gridPatterns,
  placement,
  rowCount,
} from "@/lib/grid-pattern";
import { ALL_PIECES } from "@/lib/site";
import { type Product, altToneFor, toneFor } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * The composed grid: the same pieces as the run, in the same order, arranged as
 * a lattice with deliberate holes in it rather than as one column.
 *
 * Where the arrangement comes from is `lib/grid-pattern.ts`; how it is measured
 * is the CATALOGUE GRID block in `globals.css`. This file is what happens
 * between them, and what happens when something changes.
 *
 * ── Why every tile is always in the DOM ────────────────────────────────────
 *
 * A piece the filter excludes is not unmounted. It keeps its node, its last
 * position, and fades to nothing in place, while the pieces that survive travel
 * into the gaps it leaves. That is the same instinct the run is built on and
 * for the same reason: an element that is removed has nothing to fade, and one
 * that appears already at its final position has nothing to travel from, so the
 * filter would cut between arrangements instead of resolving into one.
 *
 * What it costs is bounded on purpose. An excluded piece renders no media at
 * all until it has been shown at least once (`everShown` below), so landing
 * straight on `/?filter=Rings&view=grid` fetches images for rings and for
 * nothing else — the empty nodes for the rest are a few hundred bytes of markup
 * against a request each.
 */

/**
 * `sizes` for a tile, by how many columns it spans.
 *
 * A seam worth naming: the grid is measured by *container* query and `sizes` is
 * answered in *viewport* units, so these two describe the same ladder in
 * different languages and cannot be derived from one another. Above the `nav`
 * breakpoint the rails take a fixed 358px out of the viewport, which is what
 * makes the mapping possible at all; the percentages below are rounded down
 * from it, because guessing small asks for a slightly soft image and guessing
 * large asks for bytes that are never used.
 *
 * If the column ladder in `globals.css` changes, these change with it. Nothing
 * enforces that — a mismatch is invisible on screen and shows up only as the
 * wrong derivative in the network panel.
 */
function tileSizes(colSpan: number): string {
  const steps = [
    ["96rem", 19],
    ["72rem", 21],
    ["60rem", 24],
    ["53.75rem", 28],
  ] as const;
  const clauses = steps.map(
    ([at, vw]) => `(min-width: ${at}) ${vw * colSpan}vw`,
  );
  return [...clauses, `${46 * colSpan}vw`].join(", ");
}

/** How far a tile dims when a sibling is being hovered. */
const DIM_OPACITY = 0.32;

/**
 * The exit, when a piece is clicked: everything else leaves quickly and the
 * piece you chose does not leave at all.
 *
 * The clicked tile is deliberately given no fade of its own. It does not need
 * one — `PageFade` is already fading the whole page out over `--duration-page`
 * on its way to the product route, and that carries the one tile still visible.
 * Giving it a second fade would multiply the two, and the page would go dim
 * faster and muddier than either duration says. What the grid adds is only the
 * *difference*: the others, gone sooner, staggered outward from the piece under
 * the cursor so the arrangement recedes away from the choice rather than all at
 * once. The tiles that compound are the ones already going to zero, where
 * compounding cannot be seen.
 */
const EXIT_FADE_MS = 200;
const EXIT_STAGGER_MS = 140;

/** The filter: leavers go quickly, survivors follow them into the gaps. */
const FILTER_FADE_MS = 180;
const FILTER_MOVE_DELAY_MS = 120;

/** The arrival, when the view is switched or a filter reveals pieces again. */
const ENTER_FADE_MS = 350;
const ENTER_STAGGER_MS = 22;
const ENTER_STAGGER_CAP_MS = 260;

/** The `/product/…` this navigation is heading to, if it is heading to one. */
function targetRef(href: string | null): string | null {
  if (!href?.startsWith("/product/")) return null;
  return decodeURIComponent(href.slice("/product/".length));
}

type TileMotion = {
  opacity: number;
  fadeMs: number;
  fadeDelayMs: number;
  moveDelayMs: number;
};

/** One piece, at its slot in every one of the five compositions at once. */
function Tile({
  product,
  tone,
  altTone,
  placements,
  motion,
  interactive,
  isHovered,
  priority,
  canHover,
  enterDelayMs,
  onRef,
  onEnter,
  onLeave,
}: {
  product: Product;
  tone: string;
  altTone: string;
  /** Slot in each of `GRID_PATTERNS`, in the same order. */
  placements: GridPlacement[];
  motion: TileMotion;
  /** False for a piece the filter excludes: invisible, and out of reach. */
  interactive: boolean;
  isHovered: boolean;
  priority: boolean;
  canHover: boolean;
  /** Stagger offset for the entry keyframe, or null for no entry animation. */
  enterDelayMs: number | null;
  onRef: (el: HTMLDivElement | null) => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  // `sizes` only ever grows, and media is only ever added — never taken away.
  // A piece that has been on screen keeps its image mounted through a filter
  // that excludes it, so filtering back and forth does not re-request what the
  // browser is still holding; a piece that has never been shown renders no
  // media at all, so a first load at a filtered URL pays for the matches only.
  const [everShown, setEverShown] = useState(interactive);
  useEffect(() => {
    if (interactive) setEverShown(true);
  }, [interactive]);

  // A piece sits in a different slot in each composition, so both its shape and
  // its footprint can differ by column count — one value cannot serve all five.
  // `--ar` is therefore emitted per breakpoint like the position is, and the
  // container queries pick one.
  //
  // `sizes` cannot be: it is answered in viewport units, before any of this is
  // known. The widest footprint the piece ever has is used, so a piece that is a
  // feature at one width is never asked for a derivative too small for it —
  // erring towards a few unused bytes rather than towards a soft image, and
  // features are roughly one slot in twenty.
  const colSpan = Math.max(...placements.map((slot) => slot.colSpan));

  // Every value a string, including the numeric ones. React writes a custom
  // property given a number differently from the same number given as a string,
  // and the difference shows up as a hydration mismatch on every tile — the
  // rendered CSS is identical either way, so the only symptom is the warning
  // and a tree React declines to patch up.
  const vars: Record<string, string> = {
    "--fade-duration": `${motion.fadeMs}ms`,
    "--fade-delay": `${motion.fadeDelayMs}ms`,
    "--move-delay": `${motion.moveDelayMs}ms`,
  };
  placements.forEach((slot, i) => {
    // 2, 3, 4, 5, 6 — the ladder in globals.css, which reads these back.
    const cols = i + 2;
    vars[`--c-${cols}`] = String(slot.col);
    vars[`--r-${cols}`] = String(slot.row);
    vars[`--cs-${cols}`] = String(slot.colSpan);
    vars[`--ar-${cols}`] = String(slot.ratio);
  });

  return (
    <div
      ref={onRef}
      // `animate-mbfade` is the site's existing entry keyframe (opacity, `both`
      // fill), reused rather than reinvented so the grid arrives at the same
      // rate everything else on the site does. The delay is what makes it a
      // stagger. Reduced motion is already handled globally — the blanket reset
      // in globals.css collapses both duration and delay with `!important`.
      className={cn("piece-tile", enterDelayMs !== null && "animate-mbfade")}
      style={
        {
          ...vars,
          ...(enterDelayMs !== null && {
            animationDelay: `${enterDelayMs}ms`,
          }),
        } as React.CSSProperties
      }
      onMouseEnter={interactive ? onEnter : undefined}
      onMouseLeave={interactive ? onLeave : undefined}
      // focusin/focusout underneath, so this catches focus arriving anywhere
      // inside the tile and dims the rest exactly as a hover does — the reveal
      // is reachable from the keyboard rather than being a pointer-only state.
      onFocus={interactive ? onEnter : undefined}
      onBlur={interactive ? onLeave : undefined}
      // Excluded pieces are not merely invisible: an invisible link is still
      // focusable and still announced, so tabbing a filtered grid would walk
      // through every piece that is not in it.
      aria-hidden={!interactive || undefined}
      // `inert` and the `tabIndex={-1}` below are both here on purpose. `inert`
      // is the right answer and takes the whole subtree out of the tab order
      // and the accessibility tree at once; `tabIndex` is the one that still
      // works in a browser too old to have it. Neither is redundant with
      // `aria-hidden`, which hides the link from a screen reader while leaving
      // it perfectly focusable — a focus stop that announces nothing.
      inert={!interactive}
    >
      <div
        className="piece-tile-body"
        style={{ opacity: motion.opacity }}
      >
        <Link
          href={`/product/${product.ref}`}
          aria-label={`${product.name} — ${product.type}`}
          className="focus-ring piece-tile-media block"
          style={{ backgroundColor: tone }}
          tabIndex={interactive ? undefined : -1}
        >
          {everShown && product.media.length > 0 ? (
            <PieceMedia
              item={product.media[0]}
              name={product.name}
              sizes={tileSizes(colSpan)}
              // Bound to hover/focus rather than to being on screen — WCAG
              // 2.2.2. It matters more here than in the run: the run shows one
              // piece at a time at full size, and the grid can have thirty on
              // screen at once, every one of them able to start a loop.
              playing={isHovered}
              // The one piece with a head start. Every composition opens on a
              // feature tile, so this is the largest thing in the first
              // viewport and therefore the grid's LCP element; the rest stay
              // lazy. Note that lazy buys nothing for the tiles beside it —
              // they are above the fold too — which is why the compositions
              // open sparse. See the note in lib/grid-pattern.ts.
              priority={priority}
            />
          ) : (
            product.media.length === 0 && (
              <RenderPlaceholder
                tone={tone}
                code={product.ref}
                className="absolute inset-0"
              />
            )
          )}

          {/* The second view of the piece, or the tonal stripe when there is
              only one image. Mounted only where there is a cursor to reveal it
              with: on a touch screen this layer can never be seen, and it is a
              second full-size image per piece — on the grid that is the whole
              catalogue's bytes again, on the devices least able to afford them.
              `canHover` is false through the server render and the hydration
              after it, so the overlay is in nobody's HTML and pointer-capable
              devices add it a beat later. */}
          {everShown &&
            canHover &&
            (product.media.length > 1 ? (
              <PieceMedia
                item={product.media[1]}
                name={product.name}
                sizes={tileSizes(colSpan)}
                overlay
                show={isHovered}
              />
            ) : (
              <div
                className="render-stripe-45 absolute inset-0 transition-opacity duration-base"
                style={{ backgroundColor: altTone, opacity: isHovered ? 1 : 0 }}
                aria-hidden="true"
              />
            ))}
        </Link>

        {/* The caption, hanging in the vertical gap below the image rather than
            inside the cell. That is what lets a two-line name and a one-line
            name sit in the same lattice: the row below starts at a fixed
            distance regardless, so nothing a caption does can push a row out of
            line with its neighbours. The gap is sized to hold it — see
            `--grid-gap-y`. */}
        <div className="mt-2xs flex flex-col gap-3xs">
          <div className="flex items-baseline justify-between gap-3xs">
            <span className="font-sans text-base font-bold leading-snug text-ink">
              {product.name}
            </span>
            {/* Only ever shown for an explicit `true`. Every piece in the
                catalogue predates this field, and "nobody has said" is not the
                same claim as "not unique". */}
            {product.unique === true && (
              <span
                className="shrink-0 font-mono text-2xs uppercase tracking-wide-md text-label-lighter"
                title="One of a kind"
              >
                1/1
              </span>
            )}
          </div>
          {product.price && (
            <span className="font-mono text-sm text-label">{product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The grid.
 *
 * `filter` is a prop rather than something read from the URL here, for the same
 * reason it is in `CatalogueRun`: `useSearchParams` makes React skip
 * prerendering everything under the nearest Suspense boundary, so a component
 * that calls it cannot be part of the served HTML. See `catalogue-view.tsx`.
 */
export default function CatalogueGrid({
  products,
  filter,
}: {
  products: Product[];
  filter: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const canHover = useHoverCapable();
  const leavingTo = targetRef(usePageLeavingHref());

  const isAll = filter === ALL_PIECES;

  // Built once, on first render of the first grid — see `gridPatterns`.
  const GRID_PATTERNS = gridPatterns();

  // Tone assignment keys off a piece's position in the whole catalogue, so it
  // is the same colour in the grid as in the run and does not change when a
  // filter changes what is around it.
  const toneIndex = useMemo(
    () => new Map(products.map((p, i) => [p.ref, i])),
    [products],
  );

  /** Position among the matching pieces — which slot of the composition. */
  const matchedOrder = useMemo(() => {
    const order = new Map<string, number>();
    let n = 0;
    for (const p of products) {
      if (isAll || p.category === filter) order.set(p.ref, n++);
    }
    return order;
  }, [products, isAll, filter]);

  // The placement a piece had the last time it was shown. An excluded piece
  // fades out where it stood rather than jumping to wherever the new,
  // shorter arrangement would have put it — the fade is the whole of what says
  // "this one is leaving", and a jump underneath it says something else.
  const lastPlacements = useRef(new Map<string, GridPlacement[]>());

  const tiles = products.map((product) => {
    const index = matchedOrder.get(product.ref);
    const matched = index !== undefined;
    const placements = matched
      ? GRID_PATTERNS.map((pattern) => placement(pattern, index))
      : (lastPlacements.current.get(product.ref) ??
        GRID_PATTERNS.map((pattern) => placement(pattern, 0)));
    if (matched) lastPlacements.current.set(product.ref, placements);
    return { product, matched, index, placements };
  });

  const matchedCount = matchedOrder.size;

  /**
   * Whether this grid is here because the visitor just switched to it — the one
   * case that earns an entry stagger. See `consumeViewChange`.
   *
   * Read once, in the initialiser, and never written again: the value cannot
   * change for the life of this grid, so there is no state machine, no effect,
   * and nothing for a re-render to disturb.
   *
   * The stagger itself is a **CSS animation**, not an opacity raised by script,
   * and that is the second thing this had wrong. An element rendered at
   * `opacity: 0` and lifted in a `requestAnimationFrame` is invisible in
   * precisely the cases script does not run on schedule — a background tab,
   * where rAF is throttled indefinitely, and no-JS entirely. The whole grid
   * simply stayed blank. A `both`-filled keyframe needs none of that: its
   * resting state is its last frame, so the worst a stalled main thread can do
   * is show the finished result immediately, which is the correct picture.
   * `page-transition.tsx` learned this for the page fade; it applies here for
   * exactly the same reason.
   *
   * The animation goes on the tile while the opacity states below go on the
   * body inside it, so the two never contend for one property — a filled
   * animation would otherwise pin every tile opaque and the hover dimming would
   * silently stop working.
   */
  const [entering] = useState(consumeViewChange);

  /**
   * How long each tile waits before leaving, once a piece has been clicked.
   *
   * Measured rather than derived. The delay is a function of how far a tile is
   * from the clicked one *on screen*, and how far that is depends on the column
   * count — which lives in a container query and is therefore a fact about the
   * CSS, not about this component. One pass of `getBoundingClientRect` at the
   * moment of the click is the only way to ask, and it is a cheap one: it reads
   * layout that is already settled, changes nothing, and never runs during a
   * prerender because there is no click to run it for.
   */
  const tileEls = useRef(new Map<string, HTMLDivElement>());
  const [exitDelays, setExitDelays] = useState<Map<string, number> | null>(null);

  useEffect(() => {
    if (!leavingTo) {
      setExitDelays(null);
      return;
    }
    const origin = tileEls.current.get(leavingTo);
    // A navigation to a piece that is not on screen — a filtered-out piece
    // reached some other way. Nothing to stagger outward from, so everything
    // leaves together, which is what the page fade would have done anyway.
    if (!origin) return;

    const from = origin.getBoundingClientRect();
    const fx = from.left + from.width / 2;
    const fy = from.top + from.height / 2;

    const distances = new Map<string, number>();
    let furthest = 1;
    for (const [ref, el] of tileEls.current) {
      if (ref === leavingTo) continue;
      const box = el.getBoundingClientRect();
      const dx = box.left + box.width / 2 - fx;
      const dy = box.top + box.height / 2 - fy;
      const distance = Math.hypot(dx, dy);
      distances.set(ref, distance);
      furthest = Math.max(furthest, distance);
    }

    const delays = new Map<string, number>();
    for (const [ref, distance] of distances) {
      delays.set(ref, Math.round((distance / furthest) * EXIT_STAGGER_MS));
    }
    setExitDelays(delays);
  }, [leavingTo]);

  return (
    <div className="flex flex-col gap-lg">
      {/* Deliberately *not* `Container`. Every measure it offers is a reading
          width — the widest, `shell-xl`, is 1320px and belongs to the product
          page, where two columns of image-plus-text have to stay readable. The
          grid is not reading width: it is meant to run between the rails and
          stop only when a seventh column would turn every piece into a
          thumbnail, which is what `--grid-max` says and what `.grid-frame`
          applies. Wrapping it in a Container capped the ladder at five columns
          and made the cap unreachable.

          So this is the container's other half on its own: the page gutter, and
          nothing else. The heading takes the same frame so it lines up with the
          first tile. */}
      <div className="w-full px-gutter-tight">
        <div className="mx-auto w-full max-w-[var(--grid-max)]">
          {/* The archive's heading, kept identical in both views. The page had
              no heading of any level before this line became one — a run of
              images with nothing above them — and the grid is the same page. */}
          <Eyebrow as="h1" size="xs">
            Collection 01 — Silver &amp; Gold
          </Eyebrow>
        </div>
      </div>

      <div className="w-full px-gutter-tight">
        <div className="grid-frame">
          <div
            className="piece-grid"
            style={
              Object.fromEntries(
                GRID_PATTERNS.map((pattern, i) => [
                  `--grid-rows-${i + 2}`,
                  rowCount(pattern, matchedCount),
                ]),
              ) as React.CSSProperties
            }
          >
            {tiles.map(({ product, matched, index, placements }) => {
              const dimmed =
                matched && hovered !== null && hovered !== product.ref;
              const leaving = leavingTo !== null && product.ref !== leavingTo;

              let motion: TileMotion;
              if (!matched) {
                motion = {
                  opacity: 0,
                  fadeMs: FILTER_FADE_MS,
                  fadeDelayMs: 0,
                  moveDelayMs: 0,
                };
              } else if (leaving && exitDelays) {
                motion = {
                  opacity: 0,
                  fadeMs: EXIT_FADE_MS,
                  fadeDelayMs: exitDelays.get(product.ref) ?? 0,
                  moveDelayMs: 0,
                };
              } else {
                motion = {
                  opacity: dimmed ? DIM_OPACITY : 1,
                  fadeMs: ENTER_FADE_MS,
                  fadeDelayMs: 0,
                  // The survivors of a filter start moving fractionally after
                  // the leavers start fading, so the two read as one movement
                  // with a cause rather than as two events at once.
                  moveDelayMs: FILTER_MOVE_DELAY_MS,
                };
              }

              const gi = toneIndex.get(product.ref) ?? 0;
              return (
                <Tile
                  key={product.ref}
                  product={product}
                  tone={toneFor(gi)}
                  altTone={altToneFor(gi)}
                  placements={placements}
                  motion={motion}
                  interactive={matched}
                  isHovered={hovered === product.ref}
                  priority={index === 0}
                  canHover={canHover}
                  enterDelayMs={
                    entering
                      ? Math.min(
                          (index ?? 0) * ENTER_STAGGER_MS,
                          ENTER_STAGGER_CAP_MS,
                        )
                      : null
                  }
                  onRef={(el) => {
                    if (el) tileEls.current.set(product.ref, el);
                    else tileEls.current.delete(product.ref);
                  }}
                  onEnter={() => setHovered(product.ref)}
                  onLeave={() => setHovered(null)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
