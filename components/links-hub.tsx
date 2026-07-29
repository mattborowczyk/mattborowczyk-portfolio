"use client";

import Link from "next/link";

import { openNewsletter } from "@/components/newsletter-card";
import SocialIcons from "@/components/social-icons";
import Eyebrow from "@/components/ui/eyebrow";
import type { LinksContent } from "@/sanity/lib/fetch-data";

const rowClass =
  "flex w-full items-center justify-between border border-hairline-md px-5 py-4 text-left font-sans text-base text-ink transition-colors hover:border-hairline-strong hover:bg-band";

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="font-mono text-2xs tracking-wide-md text-label-lightest"
    >
      →
    </span>
  );
}

/** Hidden bio-link hub (link-in-bio). Not in nav; direct URL only. */
export default function LinksHub({ links }: { links: LinksContent }) {
  const { items, socials } = links;
  return (
    <div className="flex min-h-screen animate-mbfade flex-col items-center justify-center px-6 py-2xl">
      <div className="flex w-full max-w-shell-xs flex-col items-center gap-lg">
        <div className="flex flex-col items-center gap-md">
          <div className="flex flex-col items-center gap-3xs">
            <div className="font-serif text-display-md font-medium text-ink">
              mattborowczyk
            </div>
            <Eyebrow size="2xs">Jewellery &amp; Objects</Eyebrow>
          </div>
        </div>

        {/* Social channels — compact icon row, keeps the list short */}
        <SocialIcons socials={socials} />

        <div className="flex w-full flex-col gap-xs">
          {items.map((item) => {
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

        <div className="mt-md font-mono text-2xs uppercase tracking-wide-lg text-label-lightest">
          © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
