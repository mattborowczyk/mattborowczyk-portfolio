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
  based: "London",
  hours: "By appointment",
  footer: "Made to order",
} as const;

/**
 * Catalogue category filters (in display order). Only the fallback — the live
 * list comes from Site Settings in Sanity, which is where to edit it.
 */
export const categories = [
  "Shop all",
  "Rings",
  "Earrings",
  "Objects",
] as const;

/**
 * Portfolio category filters. A superset of the catalogue taxonomy — the
 * archive includes work that was never a shop line (grillz, one-off commissions).
 *
 * Unlike `categories` this is not CMS-backed: the same list drives the filter
 * rail *and* the `category` options on the Portfolio Piece schema, and a Sanity
 * option list cannot read from another document. Add a category here and it
 * appears in both places at once.
 */
export const portfolioCategories = [
  "All work",
  "Rings",
  "Earrings",
  "Grillz",
  "Objects", // the catch-all: hardware, tableware and one-offs live here for now
] as const;

/** The reset entry — shows everything, carries no `filter` param. */
export const PORTFOLIO_ALL = portfolioCategories[0];

/**
 * Right-rail page nav. "Catalogue" links back to the shop — with the filter
 * taxonomy now living on the left rail (and only on pages that have one), the
 * logo was the only way back to "/"; that's too easy to miss, so it gets its
 * own entry here too.
 *
 * The Studio page is hidden for now: its route lives in `app/(portfolio)/_studio`,
 * and Next.js excludes `_`-prefixed folders from routing, so /studio 404s. To
 * bring it back, rename the folder to `studio` and restore the nav entry:
 * `{ href: "/studio", label: "Studio" },`
 */
export const pageNav = [
  { href: "/", label: "Catalogue" },
  { href: "/portfolio", label: "Portfolio" },
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
