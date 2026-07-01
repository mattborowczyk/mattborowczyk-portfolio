import AppShell from "@/components/app-shell";
import NewsletterCard from "@/components/newsletter-card";
import { getNewsletter, getSettings } from "@/sanity/lib/fetch-data";

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, newsletter] = await Promise.all([
    getSettings(),
    getNewsletter(),
  ]);
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
