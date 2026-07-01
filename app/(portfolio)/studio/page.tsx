import type { Metadata } from "next";
import Link from "next/link";

import RenderPlaceholder from "@/components/render-placeholder";
import { studio } from "@/lib/content";

export const metadata: Metadata = {
  title: "Studio",
  description: studio.headline,
};

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-[980px] px-[clamp(20px,5vw,72px)] pb-10 pt-[clamp(48px,8vw,110px)]">
      <p className="mb-[30px] font-mono text-[11px] uppercase tracking-[0.18em] text-label">
        Studio
      </p>
      <h1 className="max-w-[16ch] font-serif text-[clamp(38px,6vw,76px)] font-medium leading-[1.02] tracking-[-0.01em] text-ink">
        {studio.headline}
      </h1>

      <div className="mt-[clamp(40px,6vw,72px)] flex flex-col items-start gap-[clamp(28px,5vw,72px)] nav:flex-row">
        <div className="w-full flex-1 nav:w-auto">
          <div className="aspect-[4/5]">
            <RenderPlaceholder tone="#c8cfc1" caption="Studio Portrait" />
          </div>
        </div>

        <div className="w-full flex-[1.2] nav:w-auto">
          {studio.paragraphs.map((p, i) => (
            <p
              key={i}
              className="mb-[22px] max-w-[46ch] text-[16px] leading-[1.8] text-body last:mb-0"
            >
              {p}
            </p>
          ))}

          <dl className="mt-9 grid grid-cols-[auto_1fr] gap-x-7 gap-y-[9px] font-mono text-[11.5px] tracking-[0.04em] text-body">
            {studio.specs.map((s) => (
              <div key={s.label} className="contents">
                <dt className="text-label-light">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          <Link
            href="/contact"
            className="mt-[34px] inline-block bg-ink px-7 py-[15px] font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:bg-gold"
          >
            Start a commission
          </Link>
        </div>
      </div>
    </div>
  );
}
