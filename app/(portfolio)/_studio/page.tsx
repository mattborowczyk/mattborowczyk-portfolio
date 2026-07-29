import type { Metadata } from "next";

import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import { CtaLink } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import SpecList from "@/components/ui/spec-list";
import { getStudio } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export async function generateMetadata(): Promise<Metadata> {
  // getStudio() is cache()-deduped with the page render below — no extra fetch.
  const studio = await getStudio();
  return {
    title: "Studio",
    description: studio.headline,
  };
}

export default async function StudioPage() {
  const studio = await getStudio();
  return (
    <Container size="lg" className="flex flex-col gap-stack pb-lg pt-section-lg">
      <div className="flex flex-col gap-md">
        <Eyebrow>Studio</Eyebrow>
        <h1 className="max-w-[16ch] font-serif text-heading-lg font-medium leading-display tracking-tight text-ink">
          {studio.headline}
        </h1>
      </div>

      <div className="flex flex-col items-start gap-stack nav:flex-row">
        <div className="w-full flex-1 nav:w-auto">
          <div className="aspect-[4/5]">
            <RenderPlaceholder tone="#c8cfc1" caption="Studio Portrait" />
          </div>
        </div>

        <div className="flex w-full flex-[1.2] flex-col gap-lg nav:w-auto">
          <div className="flex flex-col gap-md">
            {studio.paragraphs.map((p, i) => (
              <p key={i} className="max-w-[46ch] text-xl leading-loose text-body">
                {p}
              </p>
            ))}
          </div>

          <SpecList items={studio.specs} size="sm" />

          <CtaLink href="/contact" className="self-start">
            Start a commission
          </CtaLink>
        </div>
      </div>
    </Container>
  );
}
