"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import Eyebrow from "@/components/ui/eyebrow";
import { pageNav } from "@/lib/site";
import type { SiteSettings } from "@/sanity/lib/fetch-data";
import { cn } from "@/lib/utils";

type NavEntry = { href: string; label: string; active: boolean };

/** A filter taxonomy plus the rail heading it sits under. */
type FilterRail = { label: string; items: NavEntry[] };

/** Build the filter entries for one route: first entry is the reset. */
function filterEntries(
  categories: readonly string[],
  basePath: string,
  activeParam: string | null,
): NavEntry[] {
  const reset = categories[0];
  return categories.map((cat) => ({
    label: cat,
    href:
      cat === reset
        ? basePath
        : `${basePath}?filter=${encodeURIComponent(cat)}`,
    active: (activeParam ?? reset) === cat,
  }));
}

/**
 * Which filter taxonomy — if any — belongs on this route. Only the portfolio
 * run at "/" owns one; every other page shows none, so the rails stay quiet on
 * reading pages.
 */
function useFilterRail(settings: SiteSettings): FilterRail | null {
  const pathname = usePathname();
  const activeParam = useSearchParams().get("filter");

  if (pathname === "/") {
    return {
      label: "Portfolio",
      items: filterEntries(settings.categories, "/", activeParam),
    };
  }
  return null;
}

function NavItem({
  href,
  label,
  active,
  className,
}: NavEntry & { className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-sans text-base font-bold text-ink transition-opacity duration-fast hover:opacity-100",
        active ? "opacity-100" : "opacity-40",
        className,
      )}
    >
      {label}
    </Link>
  );
}

/** A labelled block of rail links. `align` follows the rail it sits in. */
function NavGroup({
  label,
  items,
  align = "left",
}: {
  label: string;
  items: NavEntry[];
  align?: "left" | "right";
}) {
  const end = align === "right";
  return (
    <div className={cn("flex flex-col gap-sm", end && "items-end text-right")}>
      <Eyebrow size="2xs" className="text-label-lighter">
        {label}
      </Eyebrow>
      <nav className={cn("flex flex-col gap-xs", end && "items-end")}>
        {items.map((item) => (
          <NavItem key={item.href + item.label} {...item} />
        ))}
      </nav>
    </div>
  );
}

/**
 * The site chrome, split across two fixed rails on desktop: the portfolio
 * filters on the left, the page nav on the right. Below the `nav` breakpoint
 * both collapse into the single top bar.
 *
 * Both link groups sit at the vertical centre of the rail — the wordmark stays
 * pinned at the top of the left rail and the studio meta at its bottom, but the
 * filters (and, on the right, the page nav) float in the middle of the screen.
 */
export default function SiteNav({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const filters = useFilterRail(settings);

  const pageItems = pageNav.map((p) => ({
    label: p.label,
    href: p.href,
    // "/" would startsWith-match every route, so Catalogue needs an exact check.
    active: p.href === "/" ? pathname === "/" : pathname.startsWith(p.href),
  }));

  return (
    <>
      {/* ── Desktop: left rail (brand + filters) ─────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-rail flex-col bg-bone px-6 py-7 nav:flex">
        <Link
          href="/"
          className="font-serif text-display-xs font-medium text-gold transition-opacity hover:opacity-65"
        >
          {settings.name}
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          {filters && <NavGroup label={filters.label} items={filters.items} />}
        </div>

        <div className="font-mono text-2xs uppercase leading-relaxed tracking-wide-lg text-label-lighter">
          <div>{settings.footer}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </aside>

      {/* ── Desktop: right rail (pages) ──────────────────────────── */}
      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-rail-right flex-col justify-center bg-bone px-6 py-7 nav:flex">
        <NavGroup label="Menu" items={pageItems} align="right" />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex flex-col gap-2xs border-b border-hairline bg-bone-veil px-5 py-3 backdrop-blur-sm nav:hidden">
        <Link href="/" className="font-sans text-lg font-bold text-gold">
          {settings.name}
        </Link>
        {/* Two rows rather than one dot-separated run: with the portfolio's
            longer taxonomy a single row wraps and orphans the separator. */}
        {filters && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {filters.items.map((item) => (
              <NavItem
                key={item.href + item.label}
                {...item}
                className="text-md"
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {pageItems.map((item) => (
            <NavItem key={item.href} {...item} className="text-md" />
          ))}
        </div>
      </header>
    </>
  );
}
