"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import RenderPlaceholder from "@/components/render-placeholder";
import { commissionMailto } from "@/lib/site";
import {
  type Product,
  altToneFor,
  materialLabel,
  toneFor,
} from "@/lib/products";

/**
 * The editorial catalogue "run": a centred vertical column of pieces that
 * alternate left/right, cross-fade to a second tone on hover, and reveal a
 * straddling info card after a 500ms dwell. When a category filter is active,
 * non-matching pieces collapse to a row of clickable swatches.
 */
export default function CatalogueRun({
  products,
  filter,
}: {
  products: Product[];
  filter: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [dwelled, setDwelled] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAll = filter === "Shop all";
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
    <div className="animate-mbfade">
      <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,72px)] pt-[clamp(52px,9vw,110px)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-label">
          COLLECTION 01 — SILVER &amp; GOLD
        </p>
      </div>

      <div className="mx-auto flex max-w-[760px] flex-col gap-[clamp(80px,11vw,120px)] px-[clamp(20px,5vw,72px)] pb-[100px] pt-12">
        {matched.map((p, i) => {
          const gi = products.indexOf(p);
          const tx = i % 2 === 0 ? "-52px" : "52px";
          const isHover = hovered === p.ref;
          const isDwell = dwelled === p.ref;
          return (
            <div
              key={p.ref}
              className="flex justify-center pb-[52px]"
              onMouseEnter={() => enter(p.ref)}
              onMouseLeave={leave}
            >
              <div
                className="relative w-[360px] max-w-[82%] transition-transform duration-500 nav:translate-x-[var(--tx)]"
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
                    className="render-stripe-45 absolute inset-0 transition-opacity [transition-duration:400ms]"
                    style={{
                      backgroundColor: altToneFor(gi),
                      opacity: isHover ? 1 : 0,
                    }}
                    aria-hidden="true"
                  />
                </Link>

                {/* Straddling info card (desktop, after 500ms dwell) */}
                <div
                  className="absolute bottom-[-46px] left-1/2 z-10 hidden w-[min(90%,236px)] -translate-x-1/2 bg-card px-[18px] pb-[16px] pt-[14px] shadow-[0_2px_20px_rgba(28,25,22,0.08)] transition-opacity [transition-duration:350ms] nav:block"
                  style={{
                    opacity: isDwell ? 1 : 0,
                    pointerEvents: isDwell ? "auto" : "none",
                  }}
                >
                  <div className="mb-[5px] flex items-baseline justify-between">
                    <span className="font-sans text-[13px] font-bold leading-none text-ink">
                      {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {p.price}
                    </span>
                  </div>
                  <div className="mb-[11px] font-mono text-[9px] uppercase tracking-[0.1em] text-label">
                    {materialLabel(p.material)}
                  </div>
                  <a
                    href={commissionMailto(`Commission – ${p.ref} ${p.name}`)}
                    className="border-b border-[rgba(40,38,33,0.25)] pb-px font-mono text-[9px] uppercase tracking-[0.12em] text-ink transition-colors hover:text-gold"
                  >
                    Commission →
                  </a>
                </div>

                {/* Caption (mobile, always visible) */}
                <div className="mt-3 nav:hidden">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans text-[13px] font-bold text-ink">
                      {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {p.price}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-label">
                    {materialLabel(p.material)} · {p.type}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Minimised swatches for non-matching pieces (click resets filter) */}
        {minimised.length > 0 && (
          <div className="flex flex-wrap justify-center gap-[10px]">
            {minimised.map((p) => (
              <Link
                key={p.ref}
                href="/"
                aria-label={`Show all — ${p.ref}`}
                className="flex h-[54px] w-[54px] items-center justify-center transition-transform [transition-duration:250ms] hover:scale-[1.08]"
                style={{ backgroundColor: toneFor(products.indexOf(p)) }}
              >
                <span className="font-mono text-[7px] text-[rgba(40,40,35,0.45)]">
                  {p.ref}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
