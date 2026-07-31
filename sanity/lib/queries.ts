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

/**
 * Media comes back with the asset dereferenced rather than transformed: the
 * mime type decides whether fetch-data runs a still through the image pipeline
 * or serves the file untouched (GIFs and video have to stay as uploaded).
 */
const productFields = groq`
  "ref": ref,
  name,
  type,
  category,
  material,
  made,
  price,
  weight,
  dimensions,
  details,
  leadTime,
  description,
  media[]{
    "type": _type,
    alt,
    "assetId": asset->_id,
    "url": asset->url,
    "mime": asset->mimeType
  }
`;

/** Newest made first; `_createdAt` only breaks ties on the same day. */
export const allProductsQuery = groq`
  *[_type == "product" && defined(ref)] | order(made desc, _createdAt desc) {
    ${productFields}
  }
`;

/** A raw media entry as returned by the projection above. */
export type ProductMediaResult = {
  type?: "image" | "file";
  alt?: string;
  assetId?: string;
  url?: string;
  mime?: string;
};

export type ProductResult = Omit<Product, "media"> & {
  media?: ProductMediaResult[];
};

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
    commissionPricingTabs[]{
      "key": key.current,
      label,
      items[]{ label, value }
    }
  }
`;

export type ContactResult = {
  details: { label: string; value: string; href?: string }[];
  commissionHeadline: string;
  commissionIntro: string;
  commissionSteps: { no: string; title: string; body: string }[];
  commissionPricingTabs: {
    key: string;
    label: string;
    items: { label: string; value: string }[];
  }[];
};

// ─── Links (singleton) ───────────────────────────────────────────────────────

export const linksQuery = groq`
  *[_type == "links" && _id == "links"][0] {
    items[]{ label, actionType, href },
    socials{ instagram, tiktok, facebook, youtube, threads, pinterest, x }
  }
`;

export type LinksResult = {
  items: {
    label: string;
    actionType: "internal" | "external" | "newsletter";
    href?: string;
  }[] | null;
  socials: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    youtube?: string;
    threads?: string;
    pinterest?: string;
    x?: string;
  } | null;
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
    categories,
    maintenanceMode,
    maintenanceHeadline,
    maintenanceMessage
  }
`;

export type SettingsResult = {
  name: string;
  tagline?: string;
  email: string;
  instagram?: string;
  footer: string;
  categories?: string[];
  maintenanceMode?: boolean;
  maintenanceHeadline?: string;
  maintenanceMessage?: string;
};

// ─── Image type ──────────────────────────────────────────────────────────────

export type SanityImage = {
  asset: { _ref: string };
  hotspot?: object;
  crop?: object;
  alt?: string;
};
