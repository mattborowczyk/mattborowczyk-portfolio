/**
 * Site-wide configuration. Single source of truth for contact details,
 * social links and nav taxonomy so they never drift across pages.
 * These become CMS-backed globals in Phase 3.
 */
/**
 * Canonical origin, no trailing slash. Single source for the sitemap, robots
 * and `metadataBase` — these must agree on the host or search engines get
 * contradictory canonical signals.
 */
export const BASE_URL = "https://mattborowczyk.com";

export const site = {
  name: "mattborowczyk",
  tagline: "Jewellery & Objects",
  email: "studio@mattborowczyk.com",
  instagram: "https://instagram.com/mattborowczyk",
  based: "Warsaw",
  hours: "By appointment",
  footer: "Made to order",
} as const;

/**
 * The reset entry prepended to the portfolio taxonomy — shows every piece and
 * carries no `filter` param.
 */
export const ALL_PIECES = "All pieces";

/**
 * Portfolio category filters (in display order). Only the fallback — the live
 * list comes from Site Settings in Sanity, which is where to edit it.
 * `ALL_PIECES` is prepended automatically, so it is not listed there.
 */
export const categories = [
  ALL_PIECES,
  "Rings",
  "Earrings",
  "Grillz",
  "Objects",
] as const;

/**
 * Right-rail page nav. "Archive" links back to the run at "/" — with the
 * filter taxonomy living on the left rail (and only on pages that have one),
 * the logo was the only way home; that's too easy to miss, so it gets its own
 * entry here too.
 *
 * The Studio page is hidden for now: its route lives in `app/(portfolio)/_studio`,
 * and Next.js excludes `_`-prefixed folders from routing, so /studio 404s. To
 * bring it back, rename the folder to `studio` and restore the nav entry:
 * `{ href: "/studio", label: "Studio" },`
 */
export const pageNav = [
  { href: "/", label: "Archive" },
  { href: "/course", label: "Course" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Resolve a raw `?filter=` value against the live taxonomy. Anything unknown
 * (stale bookmark, hand-edited URL, a category since renamed in the CMS)
 * collapses to `ALL_PIECES`.
 *
 * Shared so the run and the rail can't disagree: they previously derived this
 * separately, and an unrecognised filter showed every piece while leaving no
 * rail entry highlighted.
 *
 * Note what "the live taxonomy" now means: `getSettings().categories` is the
 * CMS list narrowed to categories that actually have pieces. A category an
 * editor has declared but not yet filled is therefore *unknown* here, and
 * collapses to `ALL_PIECES` like any other — which is what makes the empty
 * grid unreachable rather than merely handled. See `usedCategories` below.
 */
export function resolveFilter(
  categories: readonly string[],
  raw: string | null | undefined,
): string {
  return raw && categories.includes(raw) ? raw : ALL_PIECES;
}

/**
 * The two ways of reading the archive.
 *
 * `archive` is the run — one ordered column, filtering by weight rather than by
 * removal. `grid` is the composed lattice. They show the same pieces in the
 * same order; only the arrangement differs.
 */
export const ARCHIVE_VIEW = "archive";
export const GRID_VIEW = "grid";

export type ArchiveView = typeof ARCHIVE_VIEW | typeof GRID_VIEW;

/**
 * Resolve a raw `?view=` value, given whichever view Site Settings has made the
 * default. Mirrors `resolveFilter`: anything unrecognised collapses to the
 * default rather than erroring or rendering nothing.
 *
 * The default view is deliberately the one with *no* param. `viewHref` below
 * depends on it, and so does the canonical URL: with the default carrying a
 * param there would be two addresses for the same page, and flipping the
 * setting in Sanity would silently change which of them was canonical.
 */
export function resolveView(
  defaultView: ArchiveView,
  raw: string | null | undefined,
): ArchiveView {
  if (raw === ARCHIVE_VIEW || raw === GRID_VIEW) return raw;
  return defaultView;
}

/**
 * The URL that selects `view`, preserving an active filter.
 *
 * The default view drops the param entirely, so the address a visitor shares is
 * `/` (or `/?filter=Rings`) rather than `/?view=archive&filter=Rings` — one
 * canonical address per state, whichever way the setting points.
 */
export function viewHref(
  defaultView: ArchiveView,
  view: ArchiveView,
  filter: string,
): string {
  const params = new URLSearchParams();
  if (view !== defaultView) params.set("view", view);
  if (filter !== ALL_PIECES) params.set("filter", filter);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/**
 * The taxonomy narrowed to categories that actually have pieces, in the CMS's
 * display order, with `ALL_PIECES` kept at the head.
 *
 * The rail should not offer a filter that leads nowhere, and this matters more
 * in grid view than it did in the run: the run *cannot* empty, because
 * non-matching pieces shrink in place rather than leaving, so an unused
 * category showed a column of thumbnails — odd, but never blank. The grid
 * reflows, so the same click yields a heading and an empty page.
 *
 * Site Settings keeps the full list on purpose. That list is the editing
 * vocabulary — it is what the Studio's category validation checks against, and
 * a category has to exist there before the first piece can be filed under it.
 * This is only about what the rail offers a visitor.
 */
export function usedCategories(
  categories: readonly string[],
  used: Iterable<string>,
): readonly string[] {
  const inUse = new Set(used);
  return categories.filter((c) => c === ALL_PIECES || inUse.has(c));
}

/**
 * Build a prefilled commission mailto for a given piece (or a general one).
 * `email` is passed in so callers use the CMS-backed brand email (with the
 * seed `site.email` as the fallback source).
 */
export function commissionMailto(email: string, subject?: string) {
  const base = `mailto:${email}`;
  if (!subject) return base;
  return `${base}?subject=${encodeURIComponent(subject)}`;
}
