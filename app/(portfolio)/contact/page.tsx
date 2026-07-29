import type { Metadata } from "next";

import CommissionPricing from "@/components/commission-pricing";
import Container from "@/components/ui/container";
import { CtaAnchor } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import SpecList from "@/components/ui/spec-list";
import { commissionMailto } from "@/lib/site";
import { getContact, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch to commission a hand-made piece in silver or gold, or to order a standalone 3D design.",
};

export default async function ContactPage() {
  const [{ details, commission }, settings] = await Promise.all([
    getContact(),
    getSettings(),
  ]);
  const commissionHref = commissionMailto(settings.email, "Commission Enquiry");

  return (
    <Container className="flex flex-col gap-2xl pb-2xl pt-section-xl">
      {/* Intro */}
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-md">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="max-w-[18ch] font-serif text-heading-md font-medium leading-display text-ink">
            Tell me what you’d like made.
          </h1>
        </div>
        <SpecList items={details} size="base" className="gap-y-sm" />
      </div>

      {/* Commission */}
      <section className="flex flex-col gap-lg border-t border-hairline pt-xl">
        <div className="flex flex-col gap-md">
          <Eyebrow>Commission</Eyebrow>
          <h2 className="max-w-[22ch] font-serif text-heading-sm font-medium leading-display text-ink">
            {commission.headline}
          </h2>
          <p className="max-w-[52ch] text-lg leading-loose text-body-soft">
            {commission.intro}
          </p>
        </div>

        {/* Numbered steps */}
        <div className="flex flex-wrap gap-x-lg gap-y-md">
          {commission.steps.map((s) => (
            <div
              key={s.no}
              className="flex min-w-[8rem] flex-[1_1_9.5rem] flex-col gap-2xs border-t border-hairline-md pt-3.5"
            >
              <div className="font-serif text-display-xl leading-none text-gold opacity-50">
                {s.no}
              </div>
              <div className="font-sans text-base font-bold text-ink">
                {s.title}
              </div>
              <div className="text-md leading-relaxed text-body-muted">
                {s.body}
              </div>
            </div>
          ))}
        </div>

        <CommissionPricing tabs={commission.pricingTabs} />

        <CtaAnchor href={commissionHref} className="self-start">
          Start a commission →
        </CtaAnchor>
      </section>
    </Container>
  );
}
