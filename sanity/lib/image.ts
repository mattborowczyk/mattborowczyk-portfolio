import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const imageBuilder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return imageBuilder.image(source);
}
