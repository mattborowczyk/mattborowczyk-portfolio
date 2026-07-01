/**
 * Editorial copy + structured content for the Studio, Contact and Links pages.
 * Ported from the design prototype; becomes CMS singletons in Phase 3.
 */

export const studio = {
  headline: "Objects cast by hand, in silver and gold.",
  paragraphs: [
    "mattborowczyk is a studio practice making signet rings, hardware and small objects — for the home and for the hand. Pieces are unisex, weighted, and meant to stand out.",
    "Each object begins as a 3D model and is finished by hand. Nothing is mass-produced; everything is cast to order in solid silver or gold.",
    "I also offer 3D design as a standalone service — for makers and clients who want a piece modelled and rendered before it’s cast.",
  ],
  specs: [
    { label: "Practice", value: "Independent studio" },
    { label: "Materials", value: "Silver 925 · 18k Gold" },
    { label: "Method", value: "3D modelled · hand-finished" },
    { label: "Orders", value: "Made to order" },
  ],
} as const;

export const commission = {
  headline: "From a single reference to a finished piece.",
  intro:
    "Tell me the idea. I model in 3D, render for approval, then cast and finish in silver or gold. The 3D file can also be delivered standalone.",
  steps: [
    { no: "01", title: "Brief", body: "Share the idea, any references and a rough budget." },
    { no: "02", title: "3D design", body: "I model the piece and send turntable renders." },
    { no: "03", title: "Approval", body: "We refine the geometry until it is exactly right." },
    { no: "04", title: "Cast & finish", body: "Cast in silver or gold, finished by hand, shipped." },
  ],
  pricing: [
    { label: "3D design", value: "from £120" },
    { label: "Full commission", value: "from £400" },
    { label: "Lead time", value: "3–5 weeks" },
    { label: "Revisions", value: "Until approved" },
  ],
} as const;

export const contactDetails: { label: string; value: string; href?: string }[] = [
  { label: "Email", value: "studio@mattborowczyk.com", href: "mailto:studio@mattborowczyk.com" },
  { label: "Instagram", value: "@mattborowczyk", href: "https://instagram.com/mattborowczyk" },
  { label: "Based", value: "Studio practice · ships worldwide" },
  { label: "Hours", value: "By appointment" },
];

/**
 * Links (bio-link) page. `type` drives how each row renders:
 * internal route, external link, or the newsletter opener.
 */
export type LinkAction =
  | { type: "internal"; href: string }
  | { type: "external"; href: string }
  | { type: "newsletter" };

export const linkItems: { label: string; action: LinkAction }[] = [
  { label: "Shop Collection", action: { type: "internal", href: "/" } },
  { label: "Jewellery Design Course", action: { type: "internal", href: "/course" } },
  { label: "Digital Materials", action: { type: "external", href: "https://easytools.link/mattborowczyk-digital" } },
  { label: "Commission a Piece", action: { type: "internal", href: "/contact" } },
  { label: "Instagram", action: { type: "external", href: "https://instagram.com/mattborowczyk" } },
  { label: "Newsletter", action: { type: "newsletter" } },
];
