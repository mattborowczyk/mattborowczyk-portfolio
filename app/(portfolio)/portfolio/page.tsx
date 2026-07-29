import type { Metadata } from "next";

import PortfolioRun from "@/components/portfolio-run";
import Container from "@/components/ui/container";
import { CtaAnchor } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import {
  PORTFOLIO_ALL,
  commissionMailto,
  portfolioCategories,
} from "@/lib/site";
import { getPieces, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Recent pieces and commissions — work made in silver and gold, whether or not it went on sale.",
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ filter: raw }, all, settings] = await Promise.all([
    searchParams,
    getPieces(),
    getSettings(),
  ]);

  // Ignore an unknown or absent filter rather than 404-ing — the rail can only
  // ever produce a known category, so a bad one means a hand-edited URL.
  const filter =
    raw && (portfolioCategories as readonly string[]).includes(raw)
      ? raw
      : PORTFOLIO_ALL;
  const pieces =
    filter === PORTFOLIO_ALL
      ? all
      : all.filter((piece) => piece.category === filter);

  return (
    <div className="flex animate-mbfade flex-col gap-lg pt-section-lg">
      <Container className="flex flex-col gap-md">
        <Eyebrow size="xs">Portfolio — Recent work</Eyebrow>
        <p className="max-w-[46ch] text-lg leading-loose text-body-soft">
          Pieces and commissions as they leave the studio. Some are in the shop,
          some were one-offs made for a single person.
        </p>
      </Container>

      {pieces.length > 0 ? (
        <PortfolioRun pieces={pieces} email={settings.email} />
      ) : (
        <Container className="flex flex-col items-start gap-md pb-3xl">
          <p className="max-w-[42ch] font-mono text-md leading-relaxed text-body-muted">
            {all.length > 0
              ? `No ${filter.toLowerCase()} in the archive yet — but they can be made to order.`
              : "Nothing published here yet — the first pieces are being photographed. In the meantime, commissions are open."}
          </p>
          <CtaAnchor
            href={commissionMailto(settings.email, "Commission Enquiry")}
          >
            Start a commission →
          </CtaAnchor>
        </Container>
      )}
    </div>
  );
}
