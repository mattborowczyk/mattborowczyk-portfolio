import type { SiteSettings } from "@/sanity/lib/fetch-data";

/** Mono footer strip shown at the bottom of every non-Links page. */
export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-[60px] flex flex-wrap justify-between gap-3.5 border-t border-[color:var(--hairline)] px-[clamp(20px,5vw,72px)] py-[34px] font-mono text-[10px] uppercase tracking-[0.12em] text-label-light">
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
