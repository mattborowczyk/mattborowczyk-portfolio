"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import Eyebrow from "@/components/ui/eyebrow";
import { usePageLeaving } from "@/components/page-transition";
import { ALL_PIECES, pageNav, resolveFilter } from "@/lib/site";
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
  // Resolved through the same helper the run uses, so an unrecognised filter
  // highlights "All pieces" here exactly as it shows every piece there.
  const active = resolveFilter(categories, activeParam);
  return categories.map((cat) => ({
    label: cat,
    href:
      cat === ALL_PIECES
        ? basePath
        : `${basePath}?filter=${encodeURIComponent(cat)}`,
    active: active === cat,
  }));
}

/**
 * Which filter taxonomy — if any — belongs on this route. Only the portfolio
 * run at "/" owns one; every other page shows none, so the rails stay quiet on
 * reading pages.
 */
function filterRailFor(
  settings: SiteSettings,
  pathname: string,
  activeParam: string | null,
): FilterRail | null {
  if (pathname === "/") {
    return {
      label: "Archive",
      items: filterEntries(settings.categories, "/", activeParam),
    };
  }
  return null;
}

/**
 * The `?filter=` value, read live.
 *
 * Isolated into its own component — rendered through a child function rather
 * than called as a hook — so that the part of the nav that depends on the query
 * string is the *only* part that depends on it. `useSearchParams` makes React
 * skip prerendering everything under the nearest Suspense boundary, and this
 * used to be called at the top of `SiteNav`: the boundary was the whole of the
 * site chrome, so the wordmark, the page menu and the entire mobile top bar
 * were absent from the HTML of every static page and appeared only once the
 * bundle had hydrated. On a reading page the wordmark was the largest thing
 * painted, which put LCP at the end of hydration rather than at the first
 * paint, and a crawler was served a page with no navigation on it.
 *
 * Paired with a fallback rendering the same markup at `activeParam = null`, so
 * what prerenders is the rail with "All pieces" lit — which is what an
 * unfiltered visit shows anyway, and the great majority of visits are that.
 */
function LiveFilter({
  children,
}: {
  children: (activeParam: string | null) => React.ReactNode;
}) {
  return children(useSearchParams().get("filter"));
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

/**
 * A block of rail links, optionally under an eyebrow. `align` follows the rail
 * it sits in.
 *
 * The label is optional because the page menu does not carry one: "Menu" over a
 * list of three page names says nothing the names do not, and the rail reads as
 * navigation without being told. The filter rail keeps its heading — there the
 * label names the taxonomy being filtered by, which the entries alone do not.
 */
function NavGroup({
  label,
  items,
  align = "left",
  className,
}: {
  label?: string;
  items: NavEntry[];
  align?: "left" | "right";
  className?: string;
}) {
  const end = align === "right";
  return (
    <div
      className={cn(
        "flex flex-col gap-sm",
        end && "items-end text-right",
        className,
      )}
    >
      {label && (
        <Eyebrow size="2xs" className="text-label-lighter">
          {label}
        </Eyebrow>
      )}
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
 *
 * All three start at `top-draft`, not `top-0`: the draft banner is fixed across
 * the top and would otherwise cover the wordmark and the whole mobile bar. The
 * offset is 0 outside draft mode. The rails are pinned top *and* bottom for the
 * same reason — `h-screen` under a top offset would hang off the bottom edge.
 */
export default function SiteNav({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();

  // The filters leave with the run. They are the controls *for* the pieces, so
  // holding them on screen while the pieces they filter fade away would leave
  // the rail pointing at nothing. The wordmark and the page menu stay put —
  // those are the frame, and they are still true on the page being opened.
  const leaving = usePageLeaving();
  const filterFade = cn(
    "transition-opacity duration-page motion-reduce:transition-none",
    leaving && "opacity-0",
  );

  const pageItems = pageNav
    // The course can be retired from the CMS; drop its entry rather than
    // linking to a page that now 404s. The route itself enforces this too —
    // hiding the link is not the gate.
    .filter((p) => p.href !== "/course" || settings.courseEnabled)
    .map((p) => ({
      label: p.label,
      href: p.href,
      // "/" would startsWith-match every route, so Archive needs an exact check.
      active: p.href === "/" ? pathname === "/" : pathname.startsWith(p.href),
    }));

  // Whether this route has a filter rail at all is a question about the path,
  // not about the query — so it is answerable during the prerender, and a route
  // without one never mounts the boundary below.
  const hasFilters = filterRailFor(settings, pathname, null) !== null;

  const railFilters = (activeParam: string | null) => {
    const rail = filterRailFor(settings, pathname, activeParam);
    if (!rail) return null;
    return (
      <NavGroup label={rail.label} items={rail.items} className={filterFade} />
    );
  };

  // Two rows rather than one dot-separated run: with the portfolio's longer
  // taxonomy a single row wraps and orphans the separator.
  const barFilters = (activeParam: string | null) => {
    const rail = filterRailFor(settings, pathname, activeParam);
    if (!rail) return null;
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1.5",
          filterFade,
        )}
      >
        {rail.items.map((item) => (
          <NavItem key={item.href + item.label} {...item} className="text-md" />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop: left rail (brand + filters) ─────────────────── */}
      <aside className="fixed bottom-0 left-0 top-draft z-40 hidden w-rail flex-col bg-bone px-6 py-7 nav:flex">
        <Link
          href="/"
          className="font-serif text-display-xs font-medium text-gold transition-opacity hover:opacity-65"
        >
          {settings.name}
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          {hasFilters && (
            <Suspense fallback={railFilters(null)}>
              <LiveFilter>{railFilters}</LiveFilter>
            </Suspense>
          )}
        </div>

        <div className="font-mono text-2xs uppercase leading-relaxed tracking-wide-lg text-label-lighter">
          <div>{settings.footer}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </aside>

      {/* ── Desktop: right rail (pages) ──────────────────────────── */}
      <aside className="fixed bottom-0 right-0 top-draft z-40 hidden w-rail-right flex-col justify-center bg-bone px-6 py-7 nav:flex">
        <NavGroup items={pageItems} align="right" />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-draft z-40 flex flex-col gap-2xs border-b border-hairline bg-bone-veil px-5 py-3 backdrop-blur-sm nav:hidden">
        <Link href="/" className="font-sans text-lg font-bold text-gold">
          {settings.name}
        </Link>
        {hasFilters && (
          <Suspense fallback={barFilters(null)}>
            <LiveFilter>{barFilters}</LiveFilter>
          </Suspense>
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
