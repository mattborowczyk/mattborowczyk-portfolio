"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/ui/container";
import { UnderlineAnchor } from "@/components/ui/underline-link";
import { commissionMailto } from "@/lib/site";
import {
  type Product,
  type ProductMedia,
  materialLabel,
  productViews,
} from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * One media slot — a still, an animated GIF, or a looping clip.
 *
 * `object-contain`, not `cover`: the pieces are photographed and rendered
 * portrait, and the frame is wider than it is tall, so cover would scale the
 * render up until it filled the frame and crop most of it away. Contain shows
 * the whole piece and lets the frame letterbox around it.
 */
function MediaFrame({ item, name }: { item: ProductMedia; name: string }) {
  if (item.kind === "video") {
    return (
      <video
        src={item.url}
        autoPlay
        loop
        muted
        playsInline
        aria-label={item.alt || name}
        className="absolute inset-0 h-full w-full object-contain"
      />
    );
  }
  return (
    <Image
      src={item.url}
      alt={item.alt || name}
      fill
      priority
      sizes="(min-width: 38rem) 36rem, 92vw"
      className="object-contain"
      // Animated sources are served untransformed; the optimiser would flatten
      // a GIF to a single frame. Flag comes from the asset's real mime type.
      unoptimized={item.animated}
    />
  );
}

/**
 * Editorial product page. When a piece has media the markers switch between the
 * uploaded stills/clips; with none, they fall back to the sage placeholder
 * tones, so an unphotographed piece still reads as designed.
 *
 * Every spec below the fold is optional — blanks are dropped rather than
 * rendered as empty separators, and a piece with no price simply doesn't show
 * one, leaving the commission prompt to carry the call to action.
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
  const tones = productViews(index);
  const hasMedia = product.media.length > 0;
  const slots = hasMedia ? product.media : tones;
  const [active, setActive] = useState(0);

  const specLine = [
    materialLabel(product.material),
    product.details,
    product.weight,
    product.dimensions,
    product.leadTime,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      {/* Back nav — full width, outside the content measure */}
      <div className="px-gutter-tight pt-md">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wide-lg text-label transition-colors hover:text-ink"
        >
          ← Archive
        </Link>
      </div>

      {/* Media — a bounded, centred frame rather than a full-bleed band.
          The height has to be stated here: `fill` media (and the video) are
          absolutely positioned, so they contribute no height at all. The frame
          used to get its height from the in-flow placeholder block below, which
          meant that once a piece actually had media the container collapsed to
          its `min-h` floor and cropped the render to a letterbox strip. Both
          branches now share one definite height, so the page is laid out the
          same whether a piece is photographed or not. */}
      <div className="flex flex-col items-center gap-sm px-gutter-tight">
        <div
          className={cn(
            "relative flex h-[min(70vh,34rem)] w-full max-w-[36rem] items-center justify-center overflow-hidden transition-colors duration-base",
            !hasMedia && "render-stripe",
          )}
          style={!hasMedia ? { backgroundColor: tones[active] } : undefined}
        >
          {hasMedia ? (
            <MediaFrame item={product.media[active]} name={product.name} />
          ) : (
            <div className="relative flex flex-col items-center gap-1.5 text-center font-mono text-xs uppercase text-ink-ghost">
              <div className="tracking-wide-xl">3D Render</div>
              <div className="tracking-wide-lg opacity-60">{product.ref}</div>
            </div>
          )}
        </div>

        {/* View markers — only worth showing with more than one slot. They sit
            below the frame rather than inside it: a contained portrait render
            leaves the frame's corners empty, so markers pinned there floated
            in dead space instead of reading as part of the image. */}
        {slots.length > 1 && (
          <div className="flex gap-2.5">
            {slots.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "h-[0.1875rem] w-[1.625rem] bg-ink transition-opacity duration-fast",
                  i === active ? "opacity-100" : "opacity-40",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editorial info */}
      <Container size="md" tight className="flex flex-col gap-5 pb-3xl pt-section">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-serif text-heading-2xl font-medium leading-flush tracking-tight text-ink">
            {product.name}
          </h1>
          <div className="pt-3 font-mono text-xs tracking-wide-lg text-label-light">
            {product.ref}
          </div>
        </div>

        <div className="flex flex-col gap-lg border-t border-hairline pt-5">
          <div className="font-mono text-sm tracking-wide-xs text-body-muted">
            {specLine}
          </div>

          {product.description && (
            <p className="max-w-[52ch] text-xl leading-loose text-body-soft">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-lg">
            {product.price && (
              <span className="font-serif text-heading-xs leading-none text-ink">
                {product.price}
              </span>
            )}
            <UnderlineAnchor
              href={commissionMailto(email, `Commission – ${product.ref} ${product.name}`)}
              className="text-xs uppercase tracking-wide-lg"
            >
              Commission this piece →
            </UnderlineAnchor>
          </div>
        </div>
      </Container>
    </div>
  );
}
