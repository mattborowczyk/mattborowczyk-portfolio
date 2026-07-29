import { cache } from "react";

import { isSanityConfigured, sanityFetch } from "./client";
import { urlFor } from "./image";
import {
  allProductsQuery,
  allPiecesQuery,
  allCoursesQuery,
  studioQuery,
  contactQuery,
  linksQuery,
  newsletterQuery,
  settingsQuery,
  type ProductResult,
  type PieceResult,
  type PieceImageResult,
  type CourseResult,
  type StudioResult,
  type ContactResult,
  type LinksResult,
  type NewsletterResult,
  type SettingsResult,
} from "./queries";

import { type Product, products as seedProducts } from "@/lib/products";
import {
  type Piece,
  type PieceImage,
  pieces as seedPieces,
} from "@/lib/pieces";
import { type Course, courses as seedCourses } from "@/lib/courses";
import {
  studio as seedStudio,
  commission as seedCommission,
  contactDetails as seedContactDetails,
  linkItems as seedLinkItems,
  socialLinks as seedSocialLinks,
  type LinkAction,
  type SocialLinks,
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

// ─── Portfolio pieces ────────────────────────────────────────────────────────

/**
 * Resolve a piece's authored images to sized CDN URLs. Done here rather than in
 * the run so the client component only ever receives plain strings.
 */
function pieceImages(images: PieceImageResult[] | undefined): PieceImage[] {
  return (images ?? [])
    .filter((image): image is Required<PieceImageResult> => Boolean(image?.asset))
    .map((image) => ({
      url: urlFor(image).width(900).height(1200).fit("crop").auto("format").url(),
      alt: image.alt ?? "",
    }));
}

/**
 * Portfolio pieces, newest first. There is no seed to fall back to (see
 * lib/pieces.ts) — an unconfigured or empty CMS yields an empty run, and the
 * page renders its empty state.
 */
export const getPieces = cache(async (): Promise<Piece[]> =>
  withFallback<Piece[]>(
    async () => {
      const docs = await sanityFetch<PieceResult[]>({
        query: allPiecesQuery,
        tags: ["piece"],
      });
      return (docs ?? []).map((doc) => ({
        ref: doc.ref,
        name: doc.name,
        type: doc.type,
        material: doc.material ?? "",
        year: doc.completed?.slice(0, 4) ?? "",
        status: doc.status ?? "Archive",
        description: doc.description ?? "",
        images: pieceImages(doc.images),
        productRef: doc.productRef,
      }));
    },
    seedPieces,
  ),
);

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
    // A half-filled singleton (e.g. no paragraphs yet) would crash StudioPage's
    // .map() calls — treat it as empty and use the seed instead.
    (doc) => !doc.headline || !doc.paragraphs?.length || !doc.specs?.length,
  ),
);

// ─── Contact (singleton) ─────────────────────────────────────────────────────

export type PricingTab = {
  key: string;
  label: string;
  items: { label: string; value: string }[];
};

export type ContactContent = {
  details: { label: string; value: string; href?: string }[];
  commission: {
    headline: string;
    intro: string;
    steps: { no: string; title: string; body: string }[];
    pricingTabs: PricingTab[];
  };
};

const seedContact: ContactContent = {
  details: seedContactDetails,
  commission: {
    headline: seedCommission.headline,
    intro: seedCommission.intro,
    steps: [...seedCommission.steps],
    pricingTabs: seedCommission.pricingTabs.map((tab) => ({
      ...tab,
      items: [...tab.items],
    })),
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
      // Coalesce per field: a partially-filled singleton keeps whatever the
      // editor has entered and falls back to the seed for anything still blank,
      // so no section renders empty (and no undefined React keys leak through).
      // A tab still missing its key, label or rows would render an empty (and
      // unselectable) panel — drop it and fall back to the seed if none survive.
      const pricingTabs = (doc.commissionPricingTabs ?? []).filter(
        (tab) => tab?.key && tab.label && tab.items?.length,
      );

      return {
        details: doc.details?.length ? doc.details : seedContact.details,
        commission: {
          headline: doc.commissionHeadline ?? seedContact.commission.headline,
          intro: doc.commissionIntro ?? seedContact.commission.intro,
          steps: doc.commissionSteps?.length
            ? doc.commissionSteps
            : seedContact.commission.steps,
          pricingTabs: pricingTabs.length
            ? pricingTabs
            : seedContact.commission.pricingTabs,
        },
      };
    },
    seedContact,
  ),
);

// ─── Links (singleton) ───────────────────────────────────────────────────────

export type LinkItem = { label: string; action: LinkAction };
export type LinksContent = { items: LinkItem[]; socials: SocialLinks };

const seedLinks: LinksContent = {
  items: seedLinkItems,
  socials: seedSocialLinks,
};

export const getLinks = cache(async (): Promise<LinksContent> =>
  withFallback<LinksContent>(
    async () => {
      const doc = await sanityFetch<LinksResult>({
        query: linksQuery,
        tags: ["links"],
      });
      if (!doc) return null;
      const hasItems = Boolean(doc.items?.length);
      const hasSocials = Boolean(
        doc.socials && Object.values(doc.socials).some(Boolean),
      );
      if (!hasItems && !hasSocials) return null;
      // Each section falls back to its seed independently, so publishing only
      // socials (or only list items) doesn't blank out the other half.
      const items = !hasItems
        ? seedLinkItems
        : doc.items!.map((item): LinkItem => {
            if (item.actionType === "newsletter") {
              return { label: item.label, action: { type: "newsletter" } };
            }
            return {
              label: item.label,
              action: { type: item.actionType, href: item.href ?? "#" },
            };
          });
      return {
        items,
        socials: hasSocials ? doc.socials! : seedSocialLinks,
      };
    },
    seedLinks,
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
