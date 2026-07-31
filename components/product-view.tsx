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

/** One media slot — a still, an animated GIF, or a looping clip. */
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
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <Image
      src={item.url}
      alt={item.alt || name}
      fill
      priority
      sizes="100vw"
      className="object-cover"
      // GIFs are served untransformed; skip the optimiser so they keep moving.
      unoptimized={item.url.toLowerCase().includes(".gif")}
    />
  );
}

/**
 * Full-bleed editorial product page. When a piece has media the markers switch
 * between the uploaded stills/clips; with none, they fall back to the sage
 * placeholder tones, so an unphotographed piece still reads as designed.
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
    <div className="flex animate-mbfade flex-col gap-5">
      {/* Back nav — full width, outside the content measure */}
      <div className="px-gutter-tight pt-md">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wide-lg text-label transition-colors hover:text-ink"
        >
          ← Portfolio
        </Link>
      </div>

      {/* Full-bleed media */}
      <div
        className={cn(
          "relative flex max-h-[82vh] min-h-[50vh] w-full items-center justify-center overflow-hidden transition-colors duration-base",
          !hasMedia && "render-stripe",
        )}
        style={!hasMedia ? { backgroundColor: tones[active] } : undefined}
      >
        {hasMedia ? (
          <MediaFrame item={product.media[active]} name={product.name} />
        ) : (
          <div className="relative flex flex-col items-center gap-1.5 py-[clamp(6.25rem,18vw,12.5rem)] text-center font-mono text-xs uppercase text-ink-ghost">
            <div className="tracking-wide-xl">3D Render</div>
            <div className="tracking-wide-lg opacity-60">{product.ref}</div>
          </div>
        )}

        {/* View markers — only worth showing with more than one slot */}
        {slots.length > 1 && (
          <div className="absolute bottom-5 right-7 z-10 flex gap-2.5">
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
