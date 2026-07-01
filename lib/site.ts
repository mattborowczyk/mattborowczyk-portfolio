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
  footer: "MADE TO ORDER / © 2026",
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
 */
export function commissionMailto(subject?: string) {
  const base = `mailto:${site.email}`;
  if (!subject) return base;
  return `${base}?subject=${encodeURIComponent(subject)}`;
}
