"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import { UnderlineAnchor, UnderlineLink } from "@/components/ui/underline-link";
import { commissionMailto } from "@/lib/site";
import { type Piece } from "@/lib/pieces";
import { altToneFor, toneFor } from "@/lib/products";
import { cn } from "@/lib/utils";

/** Name + status row — the portfolio's answer to the catalogue's name + price. */
function PieceHeading({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3xs">
      <span className="font-sans text-base font-bold leading-none text-ink">
        {name}
      </span>
      <span className="font-mono text-sm text-ink">{status}</span>
    </div>
  );
}

/** "Silver 925 · Signet Ring · 2026", skipping whatever is not filled in. */
function metaLine(piece: Piece) {
  return [piece.material, piece.type, piece.year].filter(Boolean).join(" · ");
}

/** The piece's photo, or the sage placeholder while none is uploaded. */
function PieceStill({ piece, index }: { piece: Piece; index: number }) {
  const primary = piece.images[0];
  if (!primary) {
    return (
      <RenderPlaceholder
        tone={toneFor(index)}
        code={piece.ref}
        className="absolute inset-0"
      />
    );
  }
  return (
    <Image
      src={primary.url}
      alt={primary.alt || `${piece.name} — ${piece.type}`}
      fill
      sizes="(min-width: 60rem) 22.5rem, 82vw"
      className="object-cover"
    />
  );
}

/**
 * The portfolio "run" — the catalogue's alternating centre column, rebuilt for
 * work that is not necessarily for sale: status replaces price, and the card
 * links to the shop only for pieces that have a catalogue entry.
 *
 * On hover a piece cross-fades to its second image (or, with only one image, to
 * the tonal stripe the catalogue uses), and after a 500ms dwell the straddling
 * info card appears.
 */
export default function PortfolioRun({
  pieces,
  email,
}: {
  pieces: Piece[];
  email: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [dwelled, setDwelled] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <Container className="flex flex-col gap-run pb-3xl">
      {pieces.map((piece, i) => {
        // Alternate the run left/right of centre (desktop only). The info
        // card then goes to the opposite side, where the space is.
        const tx = i % 2 === 0 ? "-3.25rem" : "3.25rem";
        const cardSide = i % 2 === 0 ? "right" : "left";
        const isHover = hovered === piece.ref;
        const isDwell = dwelled === piece.ref;
        const secondary = piece.images[1];

        return (
          <div
            key={piece.ref}
            className="flex justify-center pb-xl"
            onMouseEnter={() => enter(piece.ref)}
            onMouseLeave={leave}
          >
            <div
              className="relative w-[22.5rem] max-w-[82%] transition-transform duration-slow nav:translate-x-[var(--tx)]"
              style={{ "--tx": tx } as React.CSSProperties}
            >
              <div
                className="relative block aspect-[3/4] overflow-hidden"
                style={{ backgroundColor: toneFor(i) }}
              >
                <PieceStill piece={piece} index={i} />

                {/* Hover state: the second still if there is one, else the tone. */}
                {secondary ? (
                  <Image
                    src={secondary.url}
                    alt=""
                    fill
                    sizes="(min-width: 60rem) 22.5rem, 82vw"
                    aria-hidden="true"
                    className="object-cover transition-opacity duration-base"
                    style={{ opacity: isHover ? 1 : 0 }}
                  />
                ) : (
                  <div
                    className="render-stripe-45 absolute inset-0 transition-opacity duration-base"
                    style={{
                      backgroundColor: altToneFor(i),
                      opacity: isHover ? 1 : 0,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Info card (desktop, after 500ms dwell) — parked in the
                  margin on the side the piece is offset away from. */}
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
                <PieceHeading name={piece.name} status={piece.status} />
                <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
                  {metaLine(piece)}
                </div>
                {piece.productRef ? (
                  <UnderlineLink
                    href={`/product/${piece.productRef}`}
                    className="mt-3xs self-start text-2xs uppercase tracking-wide-md"
                  >
                    View in shop →
                  </UnderlineLink>
                ) : (
                  <UnderlineAnchor
                    href={commissionMailto(
                      email,
                      `Commission – like ${piece.ref} ${piece.name}`,
                    )}
                    className="mt-3xs self-start text-2xs uppercase tracking-wide-md"
                  >
                    Commission similar →
                  </UnderlineAnchor>
                )}
              </div>

              {/* Caption (mobile, always visible) */}
              <div className="mt-3 flex flex-col gap-3xs nav:hidden">
                <PieceHeading name={piece.name} status={piece.status} />
                <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
                  {metaLine(piece)}
                </div>
                {piece.productRef && (
                  <Link
                    href={`/product/${piece.productRef}`}
                    className="font-mono text-2xs uppercase tracking-wide-md text-gold"
                  >
                    View in shop →
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </Container>
  );
}
