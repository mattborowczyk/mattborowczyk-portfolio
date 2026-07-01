import { groq } from "next-sanity";

import type { Product } from "@/lib/products";
import type { Course } from "@/lib/courses";

/**
 * GROQ queries + result types for the Phase 3 content model. Each projection
 * is shaped to match the local seed types (lib/*) so pages can fall back to the
 * seed without any mapping. See sanity/lib/fetch-data.ts for the cached,
 * fallback-aware getters that pages actually call.
 */

// ─── Products ────────────────────────────────────────────────────────────────

const productFields = groq`
  "ref": ref,
  name,
  type,
  category,
  material,
  price,
  weight,
  dimensions,
  finish,
  leadTime,
  description
`;

export const allProductsQuery = groq`
  *[_type == "product" && defined(ref)] | order(order asc, _createdAt asc) {
    ${productFields}
  }
`;

export type ProductResult = Product;

// ─── Courses ─────────────────────────────────────────────────────────────────

export const allCoursesQuery = groq`
  *[_type == "course" && defined(key)] | order(order asc, _createdAt asc) {
    key,
    label,
    headline,
    intro,
    price,
    meta,
    level,
    length,
    "checkoutUrl": checkoutUrl,
    modules[]{ no, title, body, duration },
    includes
  }
`;

export type CourseResult = Course;

// ─── Studio (singleton) ──────────────────────────────────────────────────────

export const studioQuery = groq`
  *[_type == "studio" && _id == "studio"][0] {
    headline,
    paragraphs,
    specs[]{ label, value }
  }
`;

export type StudioResult = {
  headline: string;
  paragraphs: string[];
  specs: { label: string; value: string }[];
};

// ─── Contact (singleton) ─────────────────────────────────────────────────────

export const contactQuery = groq`
  *[_type == "contact" && _id == "contact"][0] {
    details[]{ label, value, href },
    commissionHeadline,
    commissionIntro,
    commissionSteps[]{ no, title, body },
    commissionPricing[]{ label, value }
  }
`;

export type ContactResult = {
  details: { label: string; value: string; href?: string }[];
  commissionHeadline: string;
  commissionIntro: string;
  commissionSteps: { no: string; title: string; body: string }[];
  commissionPricing: { label: string; value: string }[];
};

// ─── Links (singleton) ───────────────────────────────────────────────────────

export const linksQuery = groq`
  *[_type == "links" && _id == "links"][0] {
    items[]{ label, actionType, href }
  }
`;

export type LinksResult = {
  items: {
    label: string;
    actionType: "internal" | "external" | "newsletter";
    href?: string;
  }[];
};

// ─── Newsletter (singleton) ──────────────────────────────────────────────────

export const newsletterQuery = groq`
  *[_type == "newsletter" && _id == "newsletter"][0] {
    headline,
    microcopy
  }
`;

export type NewsletterResult = {
  headline: string;
  microcopy: string;
};

// ─── Settings (singleton) ────────────────────────────────────────────────────

export const settingsQuery = groq`
  *[_type == "settings" && _id == "settings"][0] {
    name,
    tagline,
    email,
    instagram,
    footer,
    categories
  }
`;

export type SettingsResult = {
  name: string;
  tagline?: string;
  email: string;
  instagram?: string;
  footer: string;
  categories?: string[];
};

// ─── Image type ──────────────────────────────────────────────────────────────

export type SanityImage = {
  asset: { _ref: string };
  hotspot?: object;
  crop?: object;
  alt?: string;
};
