import Container from "@/components/ui/container";
import Eyebrow from "@/components/ui/eyebrow";
import SpecList from "@/components/ui/spec-list";
import { commissionMailto } from "@/lib/site";
import type { SiteSettings } from "@/sanity/lib/fetch-data";

/**
 * The screen every public route collapses to while "Coming soon mode" is on in
 * Site Settings. Deliberately self-contained — no rail, no footer, no nav — so
 * nothing behind the curtain is reachable from it. The one way through is the
 * email link, since commissions carry on while the site is down.
 */
export default function ComingSoon({ settings }: { settings: SiteSettings }) {
  const { headline, message } = settings.maintenance;

  const details = [
    {
      label: "Email",
      value: settings.email,
      href: commissionMailto(settings.email, "Commission Enquiry"),
    },
    ...(settings.instagram
      ? [
          {
            label: "Instagram",
            value: settings.instagram.replace(/^https?:\/\/(www\.)?/, ""),
            href: settings.instagram,
          },
        ]
      : []),
  ];

  return (
    <main className="flex min-h-screen items-center">
      <Container className="flex animate-mbfade flex-col gap-xl py-2xl">
        <div className="flex flex-col gap-md">
          <Eyebrow>{settings.name}</Eyebrow>
          <h1 className="max-w-[16ch] font-serif text-heading-md font-medium leading-display text-ink">
            {headline}
          </h1>
          <p className="max-w-[48ch] text-lg leading-loose text-body-soft">
            {message}
          </p>
        </div>

        <SpecList items={details} size="base" className="gap-y-sm" />

        <div className="font-mono text-2xs uppercase tracking-wide-lg text-label-lighter">
          {settings.footer} · © {new Date().getFullYear()}
        </div>
      </Container>
    </main>
  );
}
