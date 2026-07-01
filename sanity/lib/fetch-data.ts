import { cache } from "react";

import { isSanityConfigured, sanityFetch } from "./client";
import {
  allProductsQuery,
  allCoursesQuery,
  studioQuery,
  contactQuery,
  linksQuery,
  newsletterQuery,
  settingsQuery,
  type ProductResult,
  type CourseResult,
  type StudioResult,
  type ContactResult,
  type LinksResult,
  type NewsletterResult,
  type SettingsResult,
} from "./queries";

import { type Product, products as seedProducts } from "@/lib/products";
import { type Course, courses as seedCourses } from "@/lib/courses";
import {
  studio as seedStudio,
  commission as seedCommission,
  contactDetails as seedContactDetails,
  linkItems as seedLinkItems,
  type LinkAction,
} from "@/lib/content";
import { site as seedSite, categories as seedCategories } from "@/lib/site";

/**
 * Cached, fallback-aware getters. Every getter:
 *   1. returns the local seed when Sanity is unconfigured (no env / no project);
 *   2. queries Sanity when configured;
 *   3. falls back to the seed when Sanity returns nothing.
 * So the site renders identically with or without a connected CMS.
 *
 * Each getter is wrapped in React `cache()` so repeated calls within one
 * request (e.g. the footer + a page both reading settings) hit the network once.
 */

async function withFallback<T>(
  fetcher: () => Promise<T | null | undefined>,
  seed: T,
  isEmpty: (value: T) => boolean = () => false,
): Promise<T> {
  if (!isSanityConfigured) return seed;
  try {
    const value = await fetcher();
    if (value == null || isEmpty(value)) return seed;
    return value;
  } catch (error) {
    // Never let a CMS hiccup take the site down — fall back to the seed, but
    // surface the failure so a misconfigured/flaky Sanity is observable.
    console.error("[sanity] fetch failed, using local seed:", error);
    return seed;
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

export const getProducts = cache(async (): Promise<Product[]> =>
  withFallback(
    () => sanityFetch<ProductResult[]>({ query: allProductsQuery, tags: ["product"] }),
    seedProducts,
    (list) => list.length === 0,
  ),
);

export async function getProduct(
  ref: string,
): Promise<{ product: Product; index: number } | null> {
  const products = await getProducts();
  const index = products.findIndex((p) => p.ref === ref);
  if (index === -1) return null;
  return { product: products[index], index };
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export const getCourses = cache(async (): Promise<Course[]> =>
  withFallback(
    () => sanityFetch<CourseResult[]>({ query: allCoursesQuery, tags: ["course"] }),
    seedCourses,
    (list) => list.length === 0,
  ),
);

// ─── Studio (singleton) ──────────────────────────────────────────────────────

export type StudioContent = {
  headline: string;
  paragraphs: readonly string[];
  specs: readonly { label: string; value: string }[];
};

export const getStudio = cache(async (): Promise<StudioContent> =>
  withFallback<StudioContent>(
    () => sanityFetch<StudioResult>({ query: studioQuery, tags: ["studio"] }),
    seedStudio,
  ),
);

// ─── Contact (singleton) ─────────────────────────────────────────────────────

export type ContactContent = {
  details: { label: string; value: string; href?: string }[];
  commission: {
    headline: string;
    intro: string;
    steps: { no: string; title: string; body: string }[];
    pricing: { label: string; value: string }[];
  };
};

const seedContact: ContactContent = {
  details: seedContactDetails,
  commission: {
    headline: seedCommission.headline,
    intro: seedCommission.intro,
    steps: [...seedCommission.steps],
    pricing: [...seedCommission.pricing],
  },
};

export const getContact = cache(async (): Promise<ContactContent> =>
  withFallback<ContactContent>(
    async () => {
      const doc = await sanityFetch<ContactResult>({
        query: contactQuery,
        tags: ["contact"],
      });
      if (!doc) return null;
      return {
        details: doc.details ?? [],
        commission: {
          headline: doc.commissionHeadline,
          intro: doc.commissionIntro,
          steps: doc.commissionSteps ?? [],
          pricing: doc.commissionPricing ?? [],
        },
      };
    },
    seedContact,
  ),
);

// ─── Links (singleton) ───────────────────────────────────────────────────────

export type LinkItem = { label: string; action: LinkAction };

export const getLinks = cache(async (): Promise<LinkItem[]> =>
  withFallback<LinkItem[]>(
    async () => {
      const doc = await sanityFetch<LinksResult>({
        query: linksQuery,
        tags: ["links"],
      });
      if (!doc?.items?.length) return null;
      return doc.items.map((item): LinkItem => {
        if (item.actionType === "newsletter") {
          return { label: item.label, action: { type: "newsletter" } };
        }
        return {
          label: item.label,
          action: { type: item.actionType, href: item.href ?? "#" },
        };
      });
    },
    seedLinkItems,
    (list) => list.length === 0,
  ),
);

// ─── Newsletter (singleton) ──────────────────────────────────────────────────

export type NewsletterContent = { headline: string; microcopy: string };

const seedNewsletter: NewsletterContent = {
  headline: "New work, when it happens.",
  microcopy: "Studio releases & process notes. Sent rarely.",
};

export const getNewsletter = cache(async (): Promise<NewsletterContent> =>
  withFallback<NewsletterContent>(
    () =>
      sanityFetch<NewsletterResult>({
        query: newsletterQuery,
        tags: ["newsletter"],
      }),
    seedNewsletter,
  ),
);

// ─── Settings (singleton) ────────────────────────────────────────────────────

export type SiteSettings = {
  name: string;
  tagline: string;
  email: string;
  instagram: string;
  footer: string;
  categories: readonly string[];
};

const seedSettings: SiteSettings = {
  name: seedSite.name,
  tagline: seedSite.tagline,
  email: seedSite.email,
  instagram: seedSite.instagram,
  footer: seedSite.footer,
  categories: seedCategories,
};

export const getSettings = cache(async (): Promise<SiteSettings> =>
  withFallback<SiteSettings>(
    async () => {
      const doc = await sanityFetch<SettingsResult>({
        query: settingsQuery,
        tags: ["settings"],
      });
      if (!doc) return null;
      return {
        name: doc.name ?? seedSite.name,
        tagline: doc.tagline ?? seedSite.tagline,
        email: doc.email ?? seedSite.email,
        instagram: doc.instagram ?? seedSite.instagram,
        footer: doc.footer ?? seedSite.footer,
        // "Shop all" is implicit in the CMS — prepend it for the filter nav.
        categories: doc.categories?.length
          ? ["Shop all", ...doc.categories]
          : seedCategories,
      };
    },
    seedSettings,
  ),
);
