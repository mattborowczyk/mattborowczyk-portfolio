import { groq } from "next-sanity";

// ─── Fragments ──────────────────────────────────────────────────────────────

const imageFragment = groq`{
  asset,
  hotspot,
  crop,
  alt
}`;

const pieceCardFragment = groq`{
  _id,
  name,
  "slug": slug.current,
  "image": images[0] ${imageFragment},
  status,
  collection->{ title, "slug": slug.current }
}`;

// ─── Pieces ─────────────────────────────────────────────────────────────────

export const allPiecesQuery = groq`
  *[_type == "piece"] | order(order asc, _createdAt desc) ${pieceCardFragment}
`;

export const featuredPiecesQuery = groq`
  *[_type == "piece" && featured == true] | order(order asc) [0...6] ${pieceCardFragment}
`;

export const pieceBySlugQuery = groq`
  *[_type == "piece" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    images[] ${imageFragment},
    description,
    dimensions,
    status,
    materials[]->{ _id, name },
    collection->{ title, "slug": slug.current },
    shopifyProductId
  }
`;

export const allPieceSlugsQuery = groq`
  *[_type == "piece" && defined(slug.current)] { "slug": slug.current }
`;

// ─── Collections ─────────────────────────────────────────────────────────────

export const allCollectionsQuery = groq`
  *[_type == "collection"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "coverImage": coverImage ${imageFragment}
  }
`;

export const collectionBySlugQuery = groq`
  *[_type == "collection" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    "coverImage": coverImage ${imageFragment},
    "pieces": *[_type == "piece" && references(^._id)] | order(order asc) ${pieceCardFragment}
  }
`;

export const allCollectionSlugsQuery = groq`
  *[_type == "collection" && defined(slug.current)] { "slug": slug.current }
`;

// ─── Pages ───────────────────────────────────────────────────────────────────

export const aboutPageQuery = groq`
  *[_type == "page" && slug.current == "about"][0] {
    _id,
    title,
    body,
    "coverImage": coverImage ${imageFragment},
    seoDescription
  }
`;

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsQuery = groq`
  *[_type == "settings" && _id == "siteSettings"][0] {
    siteTitle,
    tagline,
    newsletterTitle,
    newsletterSubtitle,
    social,
    footerText
  }
`;

// ─── TypeScript types (inferred shape, not generated) ────────────────────────

export type SanityImage = {
  asset: { _ref: string };
  hotspot?: object;
  crop?: object;
  alt?: string;
};

export type Piece = {
  _id: string;
  name: string;
  slug: string;
  images?: SanityImage[];
  image?: SanityImage; // card fragment (first image only)
  description?: string;
  dimensions?: string;
  status?: "portfolio" | "for_sale" | "sold" | "commission";
  materials?: { _id: string; name: string }[];
  collection?: { title: string; slug: string };
  shopifyProductId?: string;
};

export type Collection = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: SanityImage;
  pieces?: Piece[];
};

export type Page = {
  _id: string;
  title?: string;
  body?: unknown[];
  coverImage?: SanityImage;
  seoDescription?: string;
};

export type Settings = {
  siteTitle?: string;
  tagline?: string;
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  social?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  footerText?: string;
};
