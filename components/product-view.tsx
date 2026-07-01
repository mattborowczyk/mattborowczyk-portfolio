"use client";

import { useState } from "react";
import Link from "next/link";

import { commissionMailto } from "@/lib/site";
import { type Product, materialLabel, productViews } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Full-bleed editorial product page. The three bottom-right markers switch
 * the placeholder "view" tone — a stand-in for a real image gallery. `index`
 * is the piece's position in the ordered run, used to pick placeholder tones
 * so they stay consistent with the catalogue.
 */
export default function ProductView({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const views = productViews(index);
  const [active, setActive] = useState(0);

  const specLine = [
    materialLabel(product.material),
    product.finish,
    product.weight,
    product.dimensions,
    product.leadTime,
  ].join(" · ");

  return (
    <div className="animate-mbfade">
      {/* Back nav */}
      <div className="px-[clamp(20px,4vw,52px)] pt-[22px]">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-label transition-colors hover:text-ink"
        >
          ← Catalogue
        </Link>
      </div>

      {/* Full-bleed image */}
      <div
        className="render-stripe relative mt-5 flex max-h-[82vh] min-h-[50vh] w-full items-center justify-center overflow-hidden transition-colors [transition-duration:400ms]"
        style={{ backgroundColor: views[active] }}
      >
        <div className="relative py-[clamp(100px,18vw,200px)] text-center font-mono text-[rgba(40,40,35,0.3)]">
          <div className="text-[10px] tracking-[0.22em]">3D RENDER</div>
          <div className="mt-1.5 text-[10px] tracking-[0.14em] opacity-60">
            {product.ref}
          </div>
        </div>

        {/* View markers */}
        <div className="absolute bottom-5 right-7 flex gap-[10px]">
          {views.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-[3px] w-[26px] bg-ink transition-opacity [transition-duration:250ms]",
                i === active ? "opacity-100" : "opacity-40",
              )}
            />
          ))}
        </div>
      </div>

      {/* Editorial info */}
      <div className="mx-auto max-w-[920px] px-[clamp(20px,4vw,64px)] pb-[90px] pt-[clamp(30px,5vw,56px)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-serif text-[clamp(50px,7vw,84px)] font-medium leading-[0.95] tracking-[-0.01em] text-ink">
            {product.name}
          </h1>
          <div className="pt-3 font-mono text-[10px] tracking-[0.14em] text-label-light">
            {product.ref}
          </div>
        </div>

        <div className="mb-5 h-px bg-[color:var(--hairline)]" />

        <div className="mb-8 font-mono text-[11px] tracking-[0.05em] text-body-muted">
          {specLine}
        </div>

        <p className="mb-11 max-w-[52ch] text-[16px] leading-[1.8] text-body-soft">
          {product.description}
        </p>

        <div className="flex flex-wrap items-baseline gap-8">
          <span className="font-serif text-[clamp(40px,5vw,54px)] leading-none text-ink">
            {product.price}
          </span>
          <a
            href={commissionMailto(`Commission – ${product.ref} ${product.name}`)}
            className="border-b border-[rgba(40,38,33,0.3)] pb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-gold"
          >
            Commission this piece →
          </a>
        </div>
      </div>
    </div>
  );
}
