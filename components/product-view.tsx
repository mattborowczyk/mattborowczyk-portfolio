import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import PieceVideo from "@/components/piece-video";
import Container from "@/components/ui/container";
import { CtaAnchor } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import { UnderlineAnchor } from "@/components/ui/underline-link";
import { commissionMailto } from "@/lib/site";
import {
  type Product,
  type ProductMedia,
  materialLabel,
  toneFor,
} from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * One media slot — a still, an animated GIF, or a looping clip. Fills the
 * portrait frame its parent states.
 *
 * `object-contain`, not `cover`: the pieces are photographed and rendered at
 * whatever ratio the shot happened to be, and a run of frames only reads as a
 * run if they all share one shape. Contain keeps every piece whole inside that
 * shared frame and lets the page letterbox around it; cover would scale each
 * one up until it filled the frame and crop the difference away.
 *
 * `sizes` tracks the grid below: one column under `nav`, then roughly 42vw of
 * the two-column split, capped once the shell stops growing.
 */
function MediaFrame({
  item,
  name,
  priority,
}: {
  item: ProductMedia;
  name: string;
  priority: boolean;
}) {
  // The clip is a client component of its own so this file can stay a server
  // component while the playback still answers `prefers-reduced-motion`.
  if (item.kind === "video") {
    return <PieceVideo item={item} name={name} />;
  }
  return (
    <Image
      src={item.url}
      alt={item.alt || name}
      fill
      priority={priority}
      sizes="(min-width: 86.5rem) 34rem, (min-width: 53.75rem) 42vw, 100vw"
      className="object-contain"
      // Animated sources are served untransformed; the optimiser would flatten
      // a GIF to a single frame. Flag comes from the asset's real mime type.
      unoptimized={item.animated}
    />
  );
}

/** Spec markers, in the editorial lowercase-roman style. */
const numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

/**
 * Editorial product page: the media run in the left column, the copy beside it
 * in the right, which sticks while the images scroll past. Under the `nav`
 * breakpoint the two collapse into one column — images first, copy under them —
 * and the stickiness is dropped, since there is nothing left to scroll against.
 *
 * There is no view-switcher: every slot is laid out at once, which is why this
 * is a server component with no state. A piece with no media at all still gets
 * one placeholder frame in its sage tone, so an unphotographed piece keeps the
 * same shape as a photographed one.
 *
 * Every spec below the name is optional — blanks are dropped rather than
 * rendered as empty rows, so the numbering closes up over whatever a piece
 * actually has, and a piece with no price simply doesn't show one, leaving the
 * commission prompt to carry the call to action.
 */
export default function ProductView({
  product,
  index,
  email,
}: {
  product: Product;
  index: number;
  email: string;
}) {
  const hasMedia = product.media.length > 0;
  const mailto = commissionMailto(
    email,
    `Commission – ${product.ref} ${product.name}`,
  );

  const present = (v: string | undefined): v is string => Boolean(v);
  const measurements = [product.dimensions, product.weight].filter(present);
  const makeup = [
    materialLabel(product.material),
    product.details,
    // Spelled out here rather than shown as the bare `1/1` the grid tile uses.
    // On a tile the marker sits beside a name and a price and is read as one
    // of a set of markers; here it is a sentence about the piece, in a block of
    // sentences about the piece, and "1/1" alone would be the only thing on the
    // page a visitor had to already know the convention for.
    //
    // Only an explicit `true`: every piece predates the field, and unset means
    // nobody has said, which is not the same as "not unique".
    product.unique === true ? "One of a kind (1/1)" : undefined,
  ].filter(present);

  const specs: { key: string; body: ReactNode }[] = [];
  if (product.description) {
    specs.push({
      key: "about",
      body: (
        <p className="max-w-[44ch] text-lg leading-loose">{product.description}</p>
      ),
    });
  }
  if (measurements.length) {
    specs.push({ key: "measurements", body: <Lines values={measurements} /> });
  }
  if (makeup.length || product.price) {
    specs.push({
      key: "makeup",
      body: (
        <>
          <Lines values={makeup} />
          {/* The price belongs with what the piece is made of, not off in the
              buy column: material, finish and cost are one answer to the same
              question. Set in the serif so it still reads as the figure of the
              block rather than another line of spec. */}
          {product.price && (
            <div className="pt-3xs font-serif text-display-sm leading-none text-ink">
              {product.price}
            </div>
          )}
        </>
      ),
    });
  }
  specs.push({
    key: "commission",
    // `self-start` so the rule under the link is the width of the words, not
    // of the whole column — the spec bodies are stretched flex children.
    body: (
      <UnderlineAnchor href={mailto} className="self-start text-base">
        Commissions
      </UnderlineAnchor>
    ),
  });

  return (
    <>
      {/* Three grid items in one DOM order that reads correctly at both sizes:
          lead frame, copy, the rest of the run. Stacked in that order on a
          phone — so the name and the price arrive after one image rather than
          after all of them — and re-placed on desktop by line, which stacks the
          two media items back into one run in column one and gives column two
          to the copy across both of its rows.

          Nothing sits above this grid, and that is load-bearing rather than
          tidy: anything in front of it pushes the copy column down past the
          height the page opens at, and the copy is pinned *to* that height, so
          every pixel above here is a pixel of drift before it catches. The back
          link therefore rides in the media column instead of in a band of its
          own — same place on screen either way, since that column already
          starts at the page's left edge. */}
      <Container
        size="xl"
        tight
        className="grid grid-cols-1 gap-x-xl gap-y-xl pb-3xl nav:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] nav:gap-y-sm"
      >
        <div className="flex flex-col gap-md nav:col-start-1 nav:row-start-1">
          <Link
            href="/"
            className="focus-ring self-start font-mono text-xs uppercase tracking-wide-lg text-label transition-colors hover:text-ink"
          >
            ← Archive
          </Link>

          {hasMedia ? (
            <Frame>
              {/* The one frame that is above the fold at every width. */}
              <MediaFrame item={product.media[0]} name={product.name} priority />
            </Frame>
          ) : (
            <Frame
              className="render-stripe flex items-center justify-center"
              style={{ backgroundColor: toneFor(index) }}
            >
              {/* Was `ink-ghost` (ink at 30%), which comes to 1.7:1 over the
                  sage tones behind it, with the reference code faded to 60% of
                  that again. This is the one placeholder that is real content
                  rather than decoration — the piece has no photograph, and
                  this says so — so it is the one that has to be legible.
                  `body-soft` holds 5.3:1 across every tone in the set. */}
              <div className="flex flex-col items-center gap-1.5 text-center font-mono text-xs uppercase text-body-soft">
                <div className="tracking-wide-xl">3D Render</div>
                <div className="tracking-wide-lg">{product.ref}</div>
              </div>
            </Frame>
          )}
        </div>

        {/* Copy. The grid item spans both media rows, so it is as tall as the
            whole run — that height is the distance the sticky child inside it
            has to travel. The offset clears the draft banner, which is 0rem
            when draft mode is off. */}
        <div className="nav:col-start-2 nav:row-span-2 nav:row-start-1">
          {/* One column at every width. It used to split into specs + buy on a
              wide screen, but the column is inset by both nav rails — about
              22rem of the window it never gets — so there was never as much
              room as the viewport suggested, and the split spent it on a gap
              instead of on the copy.

              The sticky offset is the *same* offset the page opens at, which is
              what keeps this side from moving at all: pinned to where it
              already is, it has nowhere to travel to, so only the media run
              scrolls. Given a shorter offset it would slide up by the
              difference before catching — a few tens of pixels of drift that
              read as the copy lagging the images rather than holding still. */}
          <div className="flex flex-col gap-lg nav:sticky nav:top-[calc(var(--draft-offset)+var(--section-lg))]">
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-2xs">
                <Eyebrow size="xs">{product.type}</Eyebrow>
                <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-3xs">
                  {/* A fixed display size rather than a fluid heading clamp:
                      the column this sits in is narrow and stays narrow, and a
                      name like "007/001 - Lighter Case" set at the clamp's
                      upper end broke into four lines inside it. */}
                  <h1 className="font-serif text-display-md font-medium leading-display tracking-tight text-ink">
                    {product.name}
                  </h1>
                  <span className="font-mono text-xs tracking-wide-lg text-label-light">
                    {product.ref}
                  </span>
                </div>
              </div>

              <ol className="flex flex-col gap-md border-t border-hairline pt-5">
                {specs.map((spec, i) => (
                  <li
                    key={spec.key}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline"
                  >
                    {/* Hidden from assistive tech: the list is an `<ol>`, so
                        a screen reader already numbers these items, and the
                        marker would be read a second time in roman. */}
                    <span
                      aria-hidden="true"
                      className="font-mono text-sm tracking-wide-xs text-label-light"
                    >
                      {numerals[i] ?? i + 1}
                    </span>
                    <div className="flex flex-col gap-3xs text-base leading-relaxed text-body-soft">
                      {spec.body}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* The call to action. Sized to its label rather than stretched to
                the column: a full-width button with left-aligned text puts all
                the slack on one side, so the padding reads as lopsided even
                though both sides are `px-lg`. Shrink-wrapped, the label sits
                between two equal paddings. */}
            <div className="flex flex-col items-start gap-md">
              <CtaAnchor href={mailto}>Commission this piece</CtaAnchor>

              {product.leadTime && (
                <p className="font-serif text-lg italic leading-relaxed text-label">
                  Made to order — allow {product.leadTime} for delivery.
                </p>
              )}
            </div>
          </div>
        </div>

        {product.media.length > 1 && (
          <div className="flex flex-col gap-sm nav:col-start-1 nav:row-start-2">
            {product.media.slice(1).map((item, i) => (
              <Frame key={`${item.url}-${i}`}>
                <MediaFrame item={item} name={product.name} priority={false} />
              </Frame>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

/**
 * One slot in the media run. Frames have to state their own height: `fill`
 * images and the video are absolutely positioned and contribute none, so a
 * frame sized by its contents would collapse to nothing. Every slot shares the
 * one ratio, so the run reads as a column rather than a ragged stack.
 */
function Frame({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/** A spec whose value is one or more lines (measurements, material + finish). */
function Lines({ values }: { values: string[] }) {
  return (
    <>
      {values.map((value, i) => (
        <div key={i}>{value}</div>
      ))}
    </>
  );
}
