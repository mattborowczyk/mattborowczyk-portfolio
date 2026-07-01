import type { Metadata } from "next";

import { CtaAnchor } from "@/components/ui/cta";
import { commission, contactDetails } from "@/lib/content";
import { commissionMailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch to commission a hand-made piece in silver or gold, or to order a standalone 3D design.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,72px)] pb-20 pt-[clamp(56px,10vw,140px)]">
      <p className="mb-[30px] font-mono text-[11px] uppercase tracking-[0.18em] text-label">
        Contact
      </p>
      <h1 className="max-w-[18ch] font-serif text-[clamp(34px,5vw,60px)] font-medium leading-[1.05] text-ink">
        Tell me what you’d like made.
      </h1>

      <dl className="mt-11 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3.5 font-mono text-[13px] tracking-[0.03em] text-body">
        {contactDetails.map((d) => (
          <div key={d.label} className="contents">
            <dt className="text-label-light">{d.label}</dt>
            <dd>
              {d.href ? (
                <a
                  href={d.href}
                  target={d.href.startsWith("http") ? "_blank" : undefined}
                  rel={d.href.startsWith("http") ? "noreferrer" : undefined}
                  className="border-b border-[rgba(40,38,33,0.3)] text-ink transition-colors hover:text-gold"
                >
                  {d.value}
                </a>
              ) : (
                <span>{d.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Commission */}
      <section className="mt-[72px] border-t border-[color:var(--hairline)] pt-[52px]">
        <p className="mb-[22px] font-mono text-[11px] uppercase tracking-[0.18em] text-label">
          Commission
        </p>
        <h2 className="mb-[18px] max-w-[22ch] font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.06] text-ink">
          {commission.headline}
        </h2>
        <p className="mb-10 max-w-[52ch] text-[15px] leading-[1.8] text-body-soft">
          {commission.intro}
        </p>

        <div className="mb-11 flex flex-wrap gap-x-7 gap-y-5">
          {commission.steps.map((s) => (
            <div
              key={s.no}
              className="min-w-[130px] flex-[1_1_150px] border-t border-[rgba(40,38,33,0.15)] pt-3.5"
            >
              <div className="mb-2.5 font-serif text-[36px] leading-none text-gold opacity-50">
                {s.no}
              </div>
              <div className="mb-[5px] font-sans text-[13px] font-bold text-ink">
                {s.title}
              </div>
              <div className="text-[12.5px] leading-[1.6] text-body-muted">
                {s.body}
              </div>
            </div>
          ))}
        </div>

        <dl className="mb-8 grid grid-cols-[auto_1fr] gap-x-7 gap-y-[11px] bg-band p-[26px] font-mono text-[12.5px] tracking-[0.02em] text-body">
          {commission.pricing.map((p) => (
            <div key={p.label} className="contents">
              <dt className="text-label-light">{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>

        <CtaAnchor href={commissionMailto("Commission Enquiry")}>
          Start a commission →
        </CtaAnchor>
      </section>
    </div>
  );
}
