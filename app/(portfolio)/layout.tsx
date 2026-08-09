import { VisualEditing } from "next-sanity";

import AppShell from "@/components/app-shell";
import ComingSoon from "@/components/coming-soon";
import DraftBanner from "@/components/draft-banner";
import NewsletterCard from "@/components/newsletter-card";
import { isDraftEnabled } from "@/sanity/lib/draft";
import { getNewsletter, getSettings } from "@/sanity/lib/fetch-data";

/**
 * Coming soon mode is deliberately gated here rather than in middleware: the
 * flag lives in Sanity (so it flips without a deploy) and this is the highest
 * point that already has `settings` in hand.
 *
 * Note what this does and doesn't guarantee. Next renders a layout and its page
 * *in parallel*, so the page underneath still executes and still runs its own
 * queries; returning `ComingSoon` instead of `children` discards that output, so
 * nothing behind the curtain is ever sent to the client. It hides the site — it
 * is not a way to stop the work behind it happening. If that ever matters (a
 * paid data source, say), the gate has to move into middleware.
 *
 * The Studio at /admin sits in its own route group and is unaffected, and the
 * curtain is skipped in development so the site stays workable locally while
 * production shows the notice.
 *
 * Draft mode lifts it for the same reason development does: previewing the site
 * behind the curtain is the whole point of the preview, and getting there
 * already required a token-validated secret from the Studio. Turning the site
 * off must not also turn off the ability to work on it.
 */
function isCurtainDown(enabled: boolean, draft: boolean) {
  return enabled && !draft && process.env.NODE_ENV !== "development";
}

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, draft] = await Promise.all([getSettings(), isDraftEnabled()]);

  if (isCurtainDown(settings.maintenance.enabled, draft)) {
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
      {/*
        Only mounted in draft mode, so the published site ships none of it.
        `VisualEditing` is what connects the page back to the Presentation tool:
        it syncs navigation between the iframe and the Studio and re-renders the
        route when a document changes, which is what makes this a live preview
        rather than a page you have to keep reloading. Click-to-edit overlays
        need stega, which the preview client deliberately leaves off — see
        `previewClient` in sanity/lib/client.ts.
      */}
      {draft && (
        <>
          <DraftBanner />
          <VisualEditing />
        </>
      )}
    </>
  );
}
