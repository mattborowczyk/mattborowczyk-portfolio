"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import Eyebrow from "@/components/ui/eyebrow";
import { usePageLeaving } from "@/components/page-transition";
import {
  ARCHIVE_VIEW,
  type ArchiveView,
  GRID_VIEW,
  pageNav,
  resolveFilter,
  resolveView,
  viewHref,
} from "@/lib/site";
import type { SiteSettings } from "@/sanity/lib/fetch-data";
import { cn } from "@/lib/utils";

type NavEntry = {
  href: string;
  label: string;
  active: boolean;
  /**
   * What `aria-current` says when this entry is the active one. "page" for a
   * destination; "true" for the view toggle, which does not take you anywhere —
   * it changes how the page you are already on is arranged, and calling that
   * the current *page* would be a second answer to a question the page nav has
   * already answered correctly.
   */
  current?: "page" | "true";
};

/**
 * Accessible name for the page menu, in the one place both the rail and the
 * mobile bar can read it from. The filter group names itself after its own
 * eyebrow ("Archive"); this group has no visible heading — see `NavGroup` — so
 * it needs a name given to it, and the two renderings of the same menu have to
 * give it the same one.
 */
const PAGE_NAV_LABEL = "Pages";

/** A group of rail entries plus the heading it sits under. */
type ControlGroup = { label: string; items: NavEntry[] };

/**
 * The visible names of the two arrangements.
 *
 * Not "Archive" and "Grid", which is what they are called in the code: the
 * right rail already has an entry called Archive and it means the *page*. Two
 * things called Archive on one screen, meaning a destination in one rail and a
 * layout in the other, is a worse problem than a slightly plainer word. These
 * describe what you get.
 */
const VIEW_LABELS: Record<ArchiveView, string> = {
  [ARCHIVE_VIEW]: "Column",
  [GRID_VIEW]: "Grid",
};

/**
 * Filter entries for the archive. Every href carries the active view, so
 * choosing a category does not quietly put you back in the other arrangement —
 * and the default view contributes no param, so the common case stays `/` and
 * `/?filter=Rings`. See `viewHref`.
 *
 * `categories` is already narrowed to the ones that have pieces (see
 * `usedCategories`), which is why there is no empty state to reach from here:
 * a category with nothing in it is never offered, and `resolveFilter` treats it
 * as unknown if it is reached by URL anyway.
 */
function filterEntries(
  categories: readonly string[],
  defaultView: ArchiveView,
  view: ArchiveView,
  activeParam: string | null,
): NavEntry[] {
  // Resolved through the same helper the archive uses, so an unrecognised
  // filter highlights "All pieces" here exactly as it shows every piece there.
  const active = resolveFilter(categories, activeParam);
  return categories.map((cat) => ({
    label: cat,
    href: viewHref(defaultView, view, cat),
    active: active === cat,
  }));
}

/** The two arrangements, each preserving whatever filter is active. */
function viewEntries(
  defaultView: ArchiveView,
  view: ArchiveView,
  filter: string,
): NavEntry[] {
  return ([ARCHIVE_VIEW, GRID_VIEW] as const).map((candidate) => ({
    label: VIEW_LABELS[candidate],
    href: viewHref(defaultView, candidate, filter),
    active: candidate === view,
    current: "true" as const,
  }));
}

/**
 * The archive's controls — if this route has any. Only the archive at "/" owns
 * them; every other page shows none, so the rails stay quiet on reading pages.
 *
 * Both groups are returned together because both are controls *for the pieces*,
 * both depend on the same two query params, and both have to leave with the
 * pieces when a navigation starts. Splitting them was two call sites resolving
 * the same params and one of them eventually forgetting to.
 */
function archiveControls(
  settings: SiteSettings,
  pathname: string,
  params: URLSearchParams | null,
): { view: ControlGroup; filters: ControlGroup } | null {
  if (pathname !== "/") return null;
  const view = resolveView(settings.defaultView, params?.get("view"));
  const filter = resolveFilter(settings.categories, params?.get("filter"));
  return {
    view: {
      label: "View",
      items: viewEntries(settings.defaultView, view, filter),
    },
    filters: {
      label: "Archive",
      items: filterEntries(
        settings.categories,
        settings.defaultView,
        view,
        params?.get("filter") ?? null,
      ),
    },
  };
}

/**
 * The query string, read live.
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
 * It yields the whole `URLSearchParams` rather than one value because the
 * archive controls now read two — the filter and the view — and they sit under
 * one boundary regardless. Two readers would only be two things to keep in step
 * about what the fallback looks like.
 *
 * Paired with a fallback rendering the same markup at `params = null`, so what
 * prerenders is the rail with "All pieces" lit and the default view selected —
 * which is what an ordinary visit shows anyway, and the great majority of
 * visits are that.
 */
function LiveParams({
  children,
}: {
  children: (params: URLSearchParams | null) => React.ReactNode;
}) {
  return children(new URLSearchParams(useSearchParams().toString()));
}

/**
 * One rail or top-bar link.
 *
 * Three things here are accessibility rather than styling:
 *
 * `aria-current="page"` — the active entry was signalled by opacity alone, so
 * a screen reader was given a list of links with nothing to say which one you
 * were on. This is the answer to that, not the class below.
 *
 * The inactive weight is 65%, not 40%. Ink at 40% over bone composites to
 * 2.45:1, which fails AA for text of any size; 65% comes to 5.12:1. The active
 * state is a smaller step than it was as a result, which is why the attribute
 * above matters more than it looks — and it is the obvious thing to revisit
 * with the rest of the palette, since the distinction now wants to come from
 * something other than lightness.
 *
 * `py-1.5 -my-1.5` grows the hit area from 18px to 30px tall without moving
 * anything: the padding makes the target, the negative margin gives the space
 * back to the layout. WCAG 2.5.8 asks for 24px, and the rail's 9px gaps put
 * the untouched targets close enough together that the spacing exemption
 * doesn't apply either.
 */
function NavItem({
  href,
  label,
  active,
  current = "page",
  className,
}: NavEntry & { className?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? current : undefined}
      className={cn(
        "focus-ring -my-1.5 py-1.5 font-sans text-base font-bold text-ink transition-opacity duration-fast hover:opacity-100",
        active ? "opacity-100" : "opacity-65",
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
      {/* Named, because the site has two of these plus the mobile bar's and a
          screen reader offered three unlabelled "navigation" landmarks has no
          way to tell the filters from the pages. The name is the rail's own
          eyebrow where there is one, so nothing new is invented for it. */}
      <nav
        aria-label={label ?? PAGE_NAV_LABEL}
        className={cn("flex flex-col gap-xs", end && "items-end")}
      >
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

  // Whether this route has archive controls at all is a question about the
  // path, not about the query — so it is answerable during the prerender, and a
  // route without them never mounts the boundary below.
  const hasControls = archiveControls(settings, pathname, null) !== null;

  /**
   * The rail: the view toggle above the taxonomy it applies to.
   *
   * Above, not below, because it decides what the filters are filtering *in* —
   * and because a control that changes the whole arrangement of the page
   * belongs before a control that changes which pieces are in it. Both fade
   * with the pieces on navigation, for the reason given at `filterFade`.
   */
  const railControls = (params: URLSearchParams | null) => {
    const controls = archiveControls(settings, pathname, params);
    if (!controls) return null;
    return (
      <div className={cn("flex flex-col gap-lg", filterFade)}>
        <NavGroup label={controls.view.label} items={controls.view.items} />
        <NavGroup
          label={controls.filters.label}
          items={controls.filters.items}
        />
      </div>
    );
  };

  /**
   * The mobile bar: both groups on one wrapping row, separated by a middot.
   *
   * One row rather than two, because the bar is already three tall — wordmark,
   * controls, pages — inside `--topbar-height`, and a fourth would push the
   * content of every archive page down by a line to hold two words. The middot
   * is `aria-hidden`; the two groups are still separate named landmarks, so
   * nothing about the separation is left to the visual arrangement alone.
   */
  const barControls = (params: URLSearchParams | null) => {
    const controls = archiveControls(settings, pathname, params);
    if (!controls) return null;
    const group = (g: ControlGroup) => (
      <nav
        aria-label={g.label}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
      >
        {g.items.map((item) => (
          <NavItem key={item.href + item.label} {...item} className="text-md" />
        ))}
      </nav>
    );
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1.5",
          filterFade,
        )}
      >
        {group(controls.view)}
        <span aria-hidden="true" className="text-label-lightest">
          ·
        </span>
        {group(controls.filters)}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop: left rail (brand + filters) ─────────────────── */}
      <aside
        aria-label="Studio"
        className="fixed bottom-0 left-0 top-draft z-40 hidden w-rail flex-col bg-bone px-6 py-7 nav:flex"
      >
        {/* Hover goes to ink rather than fading the gold out. A 65% wordmark
            was 1.83:1 against bone, and a state you can only reach by pointing
            at it is still a state the text has to be readable in. */}
        <Link
          href="/"
          className="focus-ring -my-1 self-start py-1 font-serif text-display-xs font-medium text-gold-ink transition-colors hover:text-ink"
        >
          {settings.name}
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          {hasControls && (
            <Suspense fallback={railControls(null)}>
              <LiveParams>{railControls}</LiveParams>
            </Suspense>
          )}
        </div>

        <div className="font-mono text-2xs uppercase leading-relaxed tracking-wide-lg text-label-lighter">
          <div>{settings.footer}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </aside>

      {/* ── Desktop: right rail (pages) ──────────────────────────── */}
      <aside
        aria-label="Site"
        className="fixed bottom-0 right-0 top-draft z-40 hidden w-rail-right flex-col justify-center bg-bone px-6 py-7 nav:flex"
      >
        <NavGroup items={pageItems} align="right" />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-draft z-40 flex flex-col gap-2xs border-b border-hairline bg-bone-veil px-5 py-3 backdrop-blur-sm nav:hidden">
        <Link
          href="/"
          className="focus-ring -my-1 self-start py-1 font-sans text-lg font-bold text-gold-ink"
        >
          {settings.name}
        </Link>
        {hasControls && (
          <Suspense fallback={barControls(null)}>
            <LiveParams>{barControls}</LiveParams>
          </Suspense>
        )}
        <nav
          aria-label={PAGE_NAV_LABEL}
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
        >
          {pageItems.map((item) => (
            <NavItem key={item.href} {...item} className="text-md" />
          ))}
        </nav>
      </header>
    </>
  );
}
