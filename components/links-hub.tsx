"use client";

import Link from "next/link";

import { openNewsletter } from "@/components/newsletter-card";
import { linkItems } from "@/lib/content";

const rowClass =
  "flex w-full items-center justify-between border border-[rgba(40,38,33,0.17)] px-5 py-4 text-left font-sans text-[13px] text-ink transition-colors hover:border-[rgba(40,38,33,0.3)] hover:bg-band";

function Arrow() {
  return (
    <span className="font-mono text-[9px] tracking-[0.1em] text-label-lightest">
      →
    </span>
  );
}

/** Hidden bio-link hub (link-in-bio). Not in nav; direct URL only. */
export default function LinksHub() {
  return (
    <div className="flex min-h-screen animate-mbfade flex-col items-center justify-center px-6 py-[60px]">
      <div className="flex w-[min(100%,400px)] flex-col items-center">
        {/* Avatar (intentionally circular — the one rounded shape in the design) */}
        <div className="relative mb-5 flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-sage-01">
          <div className="render-stripe absolute inset-0" />
          <span className="relative font-mono text-[7px] tracking-[0.12em] text-[rgba(40,40,35,0.4)]">
            MB
          </span>
        </div>

        <div className="mb-[5px] font-serif text-[27px] font-medium text-ink">
          mattborowczyk
        </div>
        <div className="mb-12 font-mono text-[9px] uppercase tracking-[0.2em] text-label-light">
          Jewellery &amp; Objects
        </div>

        <div className="flex w-full flex-col gap-[9px]">
          {linkItems.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                <Arrow />
              </>
            );
            if (item.action.type === "internal") {
              return (
                <Link key={item.label} href={item.action.href} className={rowClass}>
                  {content}
                </Link>
              );
            }
            if (item.action.type === "external") {
              return (
                <a
                  key={item.label}
                  href={item.action.href}
                  target="_blank"
                  rel="noreferrer"
                  className={rowClass}
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                onClick={openNewsletter}
                className={rowClass}
              >
                {content}
              </button>
            );
          })}
        </div>

        <div className="mt-[52px] font-mono text-[9px] uppercase tracking-[0.16em] text-label-lightest">
          © 2026
        </div>
      </div>
    </div>
  );
}
