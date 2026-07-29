/**
 * Portfolio pieces — the archive of work actually made, whether or not it ever
 * goes on sale. Deliberately separate from `Product` (lib/products.ts): a piece
 * has no price and no product page, it records what was made and when.
 *
 * A piece that *is* for sale carries `productRef`, which links its card through
 * to the catalogue entry.
 */

export type PieceStatus =
  | "Available"
  | "Sold"
  | "Private commission"
  | "Archive";

export const pieceStatuses: PieceStatus[] = [
  "Available",
  "Sold",
  "Private commission",
  "Archive",
];

export type PieceImage = {
  /** Ready-to-render CDN URL (transform applied server-side). */
  url: string;
  alt: string;
};

export interface Piece {
  ref: string; // short code shown on the placeholder, e.g. "PC-01"
  name: string;
  type: string; // e.g. "Signet Ring"
  category: string; // one of `portfolioCategories` (lib/site.ts)
  material: string; // free text — commissions mix stones and metals
  year: string; // "" when no completion date is set
  status: PieceStatus;
  description: string;
  images: PieceImage[];
  /** Set when the piece also exists in the catalogue — links to /product/<ref>. */
  productRef?: string;
}

/**
 * Unlike the other content types this has no invented seed: a portfolio of
 * fake work would be worse than an empty one, and the page renders a proper
 * empty state until real pieces are published in the Studio.
 */
export const pieces: Piece[] = [];
