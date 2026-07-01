/**
 * Product seed data — ported from the design prototype's data script.
 * This is the fallback source until the Sanity `product` type is wired
 * (Phase 3), at which point these same fields come from the CMS.
 */

export type Category = "Rings" | "Objects" | "Hardware" | "Tableware";
export type Material = "Silver" | "Gold";

export interface Product {
  ref: string; // unique, used as the URL slug (e.g. "SR-01")
  name: string;
  type: string; // e.g. "Signet Ring"
  category: Category;
  material: Material;
  price: string; // includes currency, e.g. "£420"
  weight: string;
  dimensions: string;
  finish: string;
  leadTime: string;
  description: string;
}

export const products: Product[] = [
  { ref: "SR-01", name: "Seal", type: "Signet Ring", category: "Rings", material: "Silver", price: "£420", weight: "6 g", dimensions: "19 mm", finish: "Hand-polished", leadTime: "3–4 weeks", description: "A weighted signet with a flat bezel, ready to be engraved." },
  { ref: "SR-02", name: "Crest", type: "Signet Ring", category: "Rings", material: "Gold", price: "£1,180", weight: "8 g", dimensions: "20 mm", finish: "Hand-polished", leadTime: "3–4 weeks", description: "A heavier signet in gold, cut deep for a wax seal." },
  { ref: "SR-03", name: "Oval", type: "Signet Ring", category: "Rings", material: "Gold", price: "£1,260", weight: "9 g", dimensions: "21 mm", finish: "Brushed", leadTime: "3–4 weeks", description: "An elongated oval face, soft at the shoulders." },
  { ref: "OB-01", name: "Ember", type: "Lighter Case", category: "Objects", material: "Silver", price: "£680", weight: "42 g", dimensions: "64×38 mm", finish: "Brushed", leadTime: "4–5 weeks", description: "A sliding sleeve for a standard lighter, in brushed silver." },
  { ref: "OB-02", name: "Ember", type: "Lighter Case", category: "Objects", material: "Gold", price: "£2,400", weight: "51 g", dimensions: "64×38 mm", finish: "Hand-polished", leadTime: "4–5 weeks", description: "The Ember sleeve cast in solid gold." },
  { ref: "OB-03", name: "Ingot", type: "Pendant", category: "Objects", material: "Silver", price: "£320", weight: "11 g", dimensions: "32 mm", finish: "Hand-polished", leadTime: "3 weeks", description: "A plain cast ingot on a fixed bail." },
  { ref: "HW-01", name: "Span", type: "Belt Buckle", category: "Hardware", material: "Silver", price: "£540", weight: "38 g", dimensions: "70×46 mm", finish: "Brushed", leadTime: "4–5 weeks", description: "A clean rectangular buckle for a 35 mm strap." },
  { ref: "HW-02", name: "Monolith", type: "Belt Buckle", category: "Hardware", material: "Gold", price: "£1,950", weight: "47 g", dimensions: "72×48 mm", finish: "Hand-polished", leadTime: "5 weeks", description: "A solid gold buckle with squared edges." },
  { ref: "TW-01", name: "Fold", type: "Napkin Ring", category: "Tableware", material: "Silver", price: "£180", weight: "14 g", dimensions: "48 mm", finish: "Brushed", leadTime: "2–3 weeks", description: "A folded band that holds a napkin or a note." },
  { ref: "TW-02", name: "Knot", type: "Napkin Ring", category: "Tableware", material: "Gold", price: "£520", weight: "22 g", dimensions: "50 mm", finish: "Hand-polished", leadTime: "3 weeks", description: "A single knot pulled in gold wire." },
];

/** Sage placeholder tones — primary and hover ("view-02") alternates. */
export const tones = ["#cdd3c7", "#c4cdc2", "#bcc5bb", "#d4d5ca", "#c8cfc1", "#c0c7bd", "#cccfc3", "#c6cdbf"];
export const altTones = ["#bfc7bb", "#cdd2c6", "#b4bdb2", "#cacbbf", "#bdc4b6", "#d0d3c8", "#c2c8bb", "#bbc2b4"];

/** Human-facing material label (matches the prototype spec sheet). */
export function materialLabel(material: Material): string {
  return material === "Silver" ? "Silver 925" : "18k Gold";
}

export function toneFor(index: number): string {
  return tones[index % tones.length];
}

export function altToneFor(index: number): string {
  return altTones[index % altTones.length];
}

/** The three placeholder "views" shown on the product page view-switcher. */
export function productViews(index: number): string[] {
  return [
    tones[index % tones.length],
    altTones[index % altTones.length],
    tones[(index + 3) % tones.length],
  ];
}

export function getProduct(ref: string): Product | undefined {
  return products.find((p) => p.ref === ref);
}

export function productIndex(ref: string): number {
  return products.findIndex((p) => p.ref === ref);
}
