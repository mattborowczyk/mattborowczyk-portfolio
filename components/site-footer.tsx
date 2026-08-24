import type { SiteSettings } from "@/sanity/lib/fetch-data";

/**
 * Mono footer strip shown at the bottom of every non-Links page.
 *
 * In flow on mobile, and **fixed** from the `nav` breakpoint up, spanning the
 * gap between the two rails so it reads as the third side of the same frame
 * rather than as something the page ends with. The rails are already fixed and
 * always visible; the footer being the one piece of chrome you had to scroll to
 * find was the odd one out.
 *
 * It is opaque rather than translucent: content scrolls underneath it, and the
 * mono text here is 10px — a blurred backdrop is not enough to keep that
 * legible over a photograph. The rails sit at `z-40`, this at `z-30`; they do
 * not overlap horizontally, but the draft banner is fixed across the top at the
 * rails' level and should stay above everything.
 *
 * `AppShell` pads the content by `--footer-height` at the same breakpoint, so
 * nothing ever ends underneath it.
 */
export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-2xl flex flex-wrap justify-between gap-sm border-t border-hairline bg-bone px-gutter py-lg font-mono text-xs uppercase tracking-wide-md text-label-light nav:fixed nav:bottom-0 nav:left-rail nav:right-rail-right nav:z-30 nav:mt-0">
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
