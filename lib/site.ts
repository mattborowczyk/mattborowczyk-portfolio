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

/** Catalogue category filters (in display order). */
export const categories = [
  "Shop all",
  "Rings",
  "Objects",
  "Hardware",
  "Tableware",
] as const;

/** STUDIO group — page nav. */
export const pageNav = [
  { href: "/studio", label: "Studio" },
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
