import AppShell from "@/components/app-shell";
import ComingSoon from "@/components/coming-soon";
import NewsletterCard from "@/components/newsletter-card";
import { getNewsletter, getSettings } from "@/sanity/lib/fetch-data";

/**
 * Coming soon mode is deliberately gated here rather than in middleware: the
 * flag lives in Sanity (so it flips without a deploy) and this is the highest
 * point that already has `settings` in hand. Not rendering `children` means the
 * page underneath never runs — nothing behind the curtain is fetched or served.
 *
 * The Studio at /admin sits in its own route group and is unaffected, and the
 * curtain is skipped in development so the site stays workable locally while
 * production shows the notice.
 */
function isCurtainDown(enabled: boolean) {
  return enabled && process.env.NODE_ENV !== "development";
}

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  if (isCurtainDown(settings.maintenance.enabled)) {
    return <ComingSoon settings={settings} />;
  }

  const newsletter = await getNewsletter();

  return (
    <>
      <AppShell settings={settings}>{children}</AppShell>
      <NewsletterCard
        headline={newsletter.headline}
        microcopy={newsletter.microcopy}
      />
    </>
  );
}
