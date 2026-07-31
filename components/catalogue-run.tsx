"use client";

import { useRef, useState } from "react";
import Link from "next/link";

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

/** Name + price row shared by the hover card and the mobile caption. */
function PieceHeading({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3xs">
      <span className="font-sans text-base font-bold leading-none text-ink">
        {name}
      </span>
      <span className="font-mono text-sm text-ink">{price}</span>
    </div>
  );
}

/**
 * The editorial portfolio "run": a centred vertical column of pieces that
 * alternate left/right, cross-fade to a second tone on hover, and reveal a
 * straddling info card after a 500ms dwell. When a category filter is active,
 * non-matching pieces collapse to a row of clickable swatches.
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
  const matched = products.filter((p) => isAll || p.category === filter);
  const minimised = isAll
    ? []
    : products.filter((p) => p.category !== filter);

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
    <div className="flex animate-mbfade flex-col gap-lg pt-section-lg">
      <Container>
        <Eyebrow size="xs">Collection 01 — Silver &amp; Gold</Eyebrow>
      </Container>

      <Container className="flex flex-col gap-run pb-3xl">
        {matched.map((p, i) => {
          const gi = products.indexOf(p);
          // Alternate the run left/right of centre (desktop only). The info
          // card then goes to the opposite side, where the space is.
          const tx = i % 2 === 0 ? "-3.25rem" : "3.25rem";
          const cardSide = i % 2 === 0 ? "right" : "left";
          const isHover = hovered === p.ref;
          const isDwell = dwelled === p.ref;
          return (
            <div
              key={p.ref}
              className="flex justify-center pb-xl"
              onMouseEnter={() => enter(p.ref)}
              onMouseLeave={leave}
            >
              <div
                className="relative w-[22.5rem] max-w-[82%] transition-transform duration-slow nav:translate-x-[var(--tx)]"
                style={{ "--tx": tx } as React.CSSProperties}
              >
                {/* Image (click → product) */}
                <Link
                  href={`/product/${p.ref}`}
                  aria-label={`${p.name} — ${p.type}`}
                  className="relative block aspect-[3/4] overflow-hidden"
                  style={{ backgroundColor: toneFor(gi) }}
                >
                  <RenderPlaceholder
                    tone={toneFor(gi)}
                    code={p.ref}
                    className="absolute inset-0"
                  />
                  <div
                    className="render-stripe-45 absolute inset-0 transition-opacity duration-base"
                    style={{
                      backgroundColor: altToneFor(gi),
                      opacity: isHover ? 1 : 0,
                    }}
                    aria-hidden="true"
                  />
                </Link>

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
                  <PieceHeading name={p.name} price={p.price} />
                  <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
                    {materialLabel(p.material)}
                  </div>
                  <UnderlineAnchor
                    href={commissionMailto(email, `Commission – ${p.ref} ${p.name}`)}
                    className="mt-3xs self-start text-2xs uppercase tracking-wide-md"
                  >
                    Commission →
                  </UnderlineAnchor>
                </div>

                {/* Caption (mobile, always visible) */}
                <div className="mt-3 flex flex-col gap-3xs nav:hidden">
                  <PieceHeading name={p.name} price={p.price} />
                  <div className="font-mono text-2xs uppercase tracking-wide-md text-label">
                    {materialLabel(p.material)} · {p.type}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Minimised swatches for non-matching pieces (click resets filter) */}
        {minimised.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2.5">
            {minimised.map((p) => (
              <Link
                key={p.ref}
                href="/"
                aria-label={`Show all — ${p.ref}`}
                className="flex h-[3.375rem] w-[3.375rem] items-center justify-center transition-transform duration-fast hover:scale-[1.08]"
                style={{ backgroundColor: toneFor(products.indexOf(p)) }}
              >
                <span className="font-mono text-3xs text-ink-faint">
                  {p.ref}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
