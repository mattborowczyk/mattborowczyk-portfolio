import { materialLabel, type Product } from "@/lib/products";
import { BASE_URL } from "@/lib/site";

/**
 * schema.org JSON-LD for the product page.
 *
 * This is a *second consumer of the product content model*, alongside the page
 * itself — and an invisible one, so it fails silently. Any change to
 * `sanity/schemas/product.ts` (a renamed field, a field that becomes optional,
 * a new one worth exposing) must be checked against the mapping below, or the
 * markup carries on describing a piece that no longer exists. The field chain
 * in CLAUDE.md ends here for `product`.
 *
 * Pieces are made to order and "buy" is a commission enquiry, not a checkout,
 * so the offer is marked `PreOrder` rather than `InStock`.
 *
 * ── Deliberately not mapped: `unique` ──────────────────────────────────────
 *
 * The `unique` flag added for the grid (rendered there as `1/1`) is checked
 * against this mapping, as the rule above requires, and left out of it on
 * purpose — recorded here so the next person does not have to re-derive the
 * answer, or worse, assume it was an oversight.
 *
 * schema.org `Product` has no edition or one-of-a-kind property. The only place
 * it could go is a generic `additionalProperty`, which no consumer reads and no
 * rich result surfaces, so it would add markup that makes a claim nothing can
 * check in exchange for nothing at all. The same instinct as `offerPrice`
 * below: this file publishes what it can stand behind and stays quiet
 * otherwise. If schema.org ever gains a real property for it, this is where it
 * goes.
 */

/**
 * Only the symbols the catalogue actually uses. `$` is deliberately absent: it
 * is four different currencies depending on where the piece was priced, and a
 * guess between them is exactly the kind of confident wrong answer this file
 * must not publish.
 */
const CURRENCY_BY_SYMBOL: Record<string, string> = { "£": "GBP", "€": "EUR" };

/**
 * One amount, with its symbol on either side — the seed writes "£420", the CMS
 * writes "60€". A comma is only accepted in thousands position, so "50,50" (a
 * European decimal comma) is refused rather than read as fifty thousand.
 */
const PRICE_PATTERN =
  /^(£|€)?\s?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)\s?(£|€)?$/;

/**
 * `price` is a display string carrying its own currency symbol; structured data
 * wants the number and the ISO code apart.
 *
 * Matched whole rather than stripped of non-digits, because the field is free
 * text in the Studio — the schema only *suggests* a format in its description —
 * and stripping turns anything else into a plausible-looking lie: "£420–£560"
 * becomes 420560, "£420 + VAT" quietly loses the qualifier. A wrong price in a
 * search result is worse than no price, so anything that is not a single
 * amount with a known symbol yields `undefined` and the caller drops the whole
 * `offers` block.
 *
 * The currency is read from the string and never assumed. Hard-coding it is how
 * a catalogue priced in euros comes to advertise sterling — the number looks
 * right, so nothing on the page or in the markup gives it away.
 *
 * A piece with no price at all yields `undefined` too — deliberately optional
 * in `Product`, so work can be shown before its price is settled. `price: 0` or
 * `NaN` would be a claim about the piece rather than the absence of one.
 */
function offerPrice(
  price: string | undefined,
): { value: number; currency: string } | undefined {
  if (!price) return undefined;
  const match = price.trim().match(PRICE_PATTERN);
  if (!match) return undefined;

  const [, leading, amount, trailing] = match;
  // Exactly one symbol, either side of the number. None means the currency is
  // unknown; two means the string contradicts itself. Neither is guessable.
  if (Boolean(leading) === Boolean(trailing)) return undefined;
  const currency = CURRENCY_BY_SYMBOL[leading ?? trailing];

  const value = Number(amount.replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? { value, currency } : undefined;
}

function productJsonLd(product: Product, brand: string) {
  const price = offerPrice(product.price);
  const url = `${BASE_URL}/product/${encodeURIComponent(product.ref)}`;

  // Google needs an image to grant the rich result. Animated media is excluded
  // for the same reason the OG card excludes it in `generateMetadata` — a video
  // URL is not an image, and a GIF is the wrong thing to hand a crawler.
  const images = product.media
    .filter((item) => item.kind === "image" && !item.animated)
    .map((item) => item.url);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} — ${product.type}`,
    sku: product.ref,
    description: product.description,
    category: product.category,
    // The same label the spec sheet shows ("Silver 925"), so the search result
    // and the page agree.
    material: materialLabel(product.material),
    brand: { "@type": "Brand", name: brand },
    url,
    ...(images.length > 0 && { image: images }),
    ...(price !== undefined && {
      offers: {
        "@type": "Offer",
        price: price.value,
        priceCurrency: price.currency,
        availability: "https://schema.org/PreOrder",
        url,
      },
    }),
  };
}

/**
 * The JSON-LD as a string ready to inject into a `<script>`. Serialisation is
 * not left to the caller because of the escaping: `<` is escaped so a CMS
 * string containing `</script>` closes nothing and cannot break out of the tag.
 */
export function productJsonLdScript(product: Product, brand: string): string {
  return JSON.stringify(productJsonLd(product, brand)).replace(/</g, "\\u003c");
}
