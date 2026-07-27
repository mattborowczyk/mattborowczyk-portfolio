"use client";

import { useState } from "react";
import Link from "next/link";

import Container from "@/components/ui/container";
import { UnderlineAnchor } from "@/components/ui/underline-link";
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
  email,
}: {
  product: Product;
  index: number;
  email: string;
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
    <div className="flex animate-mbfade flex-col gap-5">
      {/* Back nav — full width, outside the content measure */}
      <div className="px-gutter-tight pt-md">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wide-lg text-label transition-colors hover:text-ink"
        >
          ← Catalogue
        </Link>
      </div>

      {/* Full-bleed image */}
      <div
        className="render-stripe relative flex max-h-[82vh] min-h-[50vh] w-full items-center justify-center overflow-hidden transition-colors duration-base"
        style={{ backgroundColor: views[active] }}
      >
        <div className="relative flex flex-col items-center gap-1.5 py-[clamp(6.25rem,18vw,12.5rem)] text-center font-mono text-xs uppercase text-ink-ghost">
          <div className="tracking-wide-xl">3D Render</div>
          <div className="tracking-wide-lg opacity-60">{product.ref}</div>
        </div>

        {/* View markers */}
        <div className="absolute bottom-5 right-7 flex gap-2.5">
          {views.map((_, i) => (
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

          <p className="max-w-[52ch] text-xl leading-loose text-body-soft">
            {product.description}
          </p>

          <div className="flex flex-wrap items-baseline gap-lg">
            <span className="font-serif text-heading-xs leading-none text-ink">
              {product.price}
            </span>
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
