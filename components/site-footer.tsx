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
          className="transition-colors hover:text-ink"
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
