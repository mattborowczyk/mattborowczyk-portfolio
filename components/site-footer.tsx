import { site } from "@/lib/site";

/** Mono footer strip shown at the bottom of every non-Links page. */
export default function SiteFooter() {
  return (
    <footer className="mt-[60px] flex flex-wrap justify-between gap-3.5 border-t border-[color:var(--hairline)] px-[clamp(20px,5vw,72px)] py-[34px] font-mono text-[10px] uppercase tracking-[0.12em] text-label-light">
      <span>{site.email}</span>
      <a
        href={site.instagram}
        target="_blank"
        rel="noreferrer"
        className="transition-colors hover:text-ink"
      >
        @{site.name}
      </a>
      <span>© 2026 — Made to order</span>
    </footer>
  );
}
