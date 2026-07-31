/**
 * Site-wide configuration. Single source of truth for contact details,
 * social links and nav taxonomy so they never drift across pages.
 * These become CMS-backed globals in Phase 3.
 */
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
 * Right-rail page nav. "Portfolio" links back to the run at "/" — with the
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
  { href: "/", label: "Portfolio" },
  { href: "/course", label: "Course" },
  { href: "/contact", label: "Contact" },
] as const;

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
