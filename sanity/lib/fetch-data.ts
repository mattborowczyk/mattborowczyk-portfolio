import { cache } from "react";

import { isSanityConfigured, sanityFetch } from "./client";
import { urlFor } from "./image";
import {
  allProductsQuery,
  allCoursesQuery,
  studioQuery,
  contactQuery,
  linksQuery,
  newsletterQuery,
  settingsQuery,
  type ProductResult,
  type ProductMediaResult,
  type CourseResult,
  type StudioResult,
  type ContactResult,
  type LinksResult,
  type NewsletterResult,
  type SettingsResult,
} from "./queries";

import {
  type Product,
  type ProductMedia,
  products as seedProducts,
} from "@/lib/products";
import {
  type Course,
  type CourseModule,
  courses as seedCourses,
} from "@/lib/courses";
import {
  studio as seedStudio,
  commission as seedCommission,
  contactDetails as seedContactDetails,
  linkItems as seedLinkItems,
  socialLinks as seedSocialLinks,
  type LinkAction,
  type SocialLinks,
} from "@/lib/content";
import {
  ALL_PIECES,
  site as seedSite,
  categories as seedCategories,
} from "@/lib/site";

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

/**
 * Resolve a piece's media to ready-to-render URLs, so the client components
 * only ever receive plain strings.
 *
 * Anything that moves — video, and GIFs — is served straight from the CDN:
 * putting a GIF through the image pipeline flattens it to a single frame.
 * Stills get resized and format-negotiated as usual.
 */
function productMedia(media: ProductMediaResult[] | undefined): ProductMedia[] {
  return (media ?? [])
    .filter((item) => item?.url)
    .map((item) => {
      const isVideo =
        item.type === "file" || Boolean(item.mime?.startsWith("video/"));
      const isAnimated = isVideo || item.mime === "image/gif";
      return {
        kind: isVideo ? ("video" as const) : ("image" as const),
        animated: isAnimated,
        url:
          isAnimated || !item.assetId
            ? item.url!
            : // Passed as a full image object, not a bare asset id, so the
              // hotspot/crop set in the Studio is honoured — with just the id
              // the builder has nothing to crop against and the setting is
              // silently ignored.
              urlFor({
                _type: "image",
                asset: { _type: "reference", _ref: item.assetId },
                hotspot: item.hotspot,
                crop: item.crop,
              })
                .width(1600)
                .auto("format")
                .url(),
        alt: item.alt ?? "",
      };
    });
}

/**
 * Newest made first. ISO-8601 dates are zero-padded and fixed-width, so a plain
 * lexicographic compare is exact — and unlike `localeCompare` it can't be
 * reordered by the runtime's locale.
 */
const byMadeDesc = (a: Product, b: Product) => {
  const x = a.made ?? "";
  const y = b.made ?? "";
  if (x === y) return 0;
  return x < y ? 1 : -1;
};

/**
 * The run is ordered by the date a piece was *made*. The GROQ query already
 * sorts, but the sort is re-applied here so the local seed obeys the same rule
 * and the ordering contract lives in one place rather than in array order.
 */
export const getProducts = cache(async (): Promise<Product[]> => {
  const list = await withFallback(
    async () => {
      const docs = await sanityFetch<ProductResult[]>({
        query: allProductsQuery,
        tags: ["product"],
      });
      return (docs ?? []).map((doc) => ({
        ...doc,
        media: productMedia(doc.media),
      }));
    },
    seedProducts,
    (list) => list.length === 0,
  );
  return [...list].sort(byMadeDesc);
});

export async function getProduct(
  ref: string,
): Promise<{ product: Product; index: number } | null> {
  const products = await getProducts();
  const index = products.findIndex((p) => p.ref === ref);
  if (index === -1) return null;
  return { product: products[index], index };
}

// ─── Courses ─────────────────────────────────────────────────────────────────

/**
 * Normalise one CMS course into the shape the page renders. Only key/label/
 * headline are guaranteed (the query filters on them); every array is coerced
 * so `.map()` is always safe, and modules missing their number or title are
 * dropped rather than rendered as blanks.
 */
function normaliseCourse(doc: CourseResult): Course {
  return {
    key: doc.key,
    label: doc.label,
    headline: doc.headline,
    intro: doc.intro ?? undefined,
    price: doc.price ?? undefined,
    meta: doc.meta ?? undefined,
    level: doc.level ?? undefined,
    length: doc.length ?? undefined,
    checkoutUrl: doc.checkoutUrl ?? null,
    modules: (doc.modules ?? [])
      .filter((m): m is Partial<CourseModule> => Boolean(m?.no && m.title))
      .map((m) => ({
        no: m.no!,
        title: m.title!,
        body: m.body ?? undefined,
        duration: m.duration ?? undefined,
      })),
    includes: (doc.includes ?? []).filter((i): i is string => Boolean(i)),
  };
}

export const getCourses = cache(async (): Promise<Course[]> =>
  withFallback(
    async () => {
      const docs = await sanityFetch<CourseResult[]>({
        query: allCoursesQuery,
        tags: ["course"],
      });
      return (docs ?? []).map(normaliseCourse);
    },
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
  /** Faithful mirror of the CMS switch — the dev bypass lives at the gate. */
  maintenance: { enabled: boolean; headline: string; message: string };
};

const seedMaintenance = {
  enabled: false,
  headline: "Back shortly.",
  message:
    "The studio site is being reworked. Commissions are still open — get in touch by email.",
};

const seedSettings: SiteSettings = {
  name: seedSite.name,
  tagline: seedSite.tagline,
  email: seedSite.email,
  instagram: seedSite.instagram,
  footer: seedSite.footer,
  categories: seedCategories,
  maintenance: seedMaintenance,
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
        // The reset entry is implicit in the CMS — prepend it for the filter nav.
        categories: doc.categories?.length
          ? [ALL_PIECES, ...doc.categories]
          : seedCategories,
        maintenance: {
          enabled: doc.maintenanceMode === true,
          headline: doc.maintenanceHeadline ?? seedMaintenance.headline,
          message: doc.maintenanceMessage ?? seedMaintenance.message,
        },
      };
    },
    seedSettings,
  ),
);
