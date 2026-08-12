import type { SiteSettings } from "@/sanity/lib/fetch-data";

/** Mono footer strip shown at the bottom of every non-Links page. */
export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-2xl flex flex-wrap justify-between gap-sm border-t border-hairline px-gutter py-lg font-mono text-xs uppercase tracking-wide-md text-label-light">
      <span>{settings.email}</span>
      {settings.instagram && (
        <a
          href={settings.instagram}
          target="_blank"
          rel="noreferrer"
          // `-my-1.5 py-1.5` takes the 15px-tall link to 27px of target
          // without moving it — the padding makes the hit area, the negative
          // margin hands the space back to the row. WCAG 2.5.8 wants 24.
          className="focus-ring -my-1.5 py-1.5 transition-colors hover:text-ink"
        >
          @{settings.name}
        </a>
      )}
      <span>
        © {year} — {settings.footer}
      </span>
    </footer>
  );
}
