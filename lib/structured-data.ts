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
 */

/**
 * `price` is a display string carrying the symbol and thousands separators
 * ("£1,180"); structured data wants a bare number, so everything that isn't a
 * digit or a decimal point is stripped.
 *
 * A piece with no price — deliberately optional in `Product`, so work can be
 * shown before its price is settled — yields `undefined`, and the caller drops
 * the whole `offers` block. `price: 0` or `NaN` would be a claim about the
 * piece rather than the absence of one.
 */
function offerPrice(price: string | undefined): number | undefined {
  if (!price) return undefined;
  const value = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : undefined;
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
        price,
        // Hard-coded because every price in the catalogue is quoted in sterling.
        // If that ever stops being true the currency has to come from the data,
        // or the number and the symbol on the page disagree.
        priceCurrency: "GBP",
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
