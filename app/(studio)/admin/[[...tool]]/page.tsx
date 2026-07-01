/**
 * Embedded Sanity Studio at /admin (moved off /studio, which is now the
 * public Studio page).
 *
 * The config + NextStudio live in a client component (./Studio) so Sanity's
 * client-only code is not evaluated on the server during the build.
 */
import { Studio } from "./Studio";

export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-static";

export default function StudioPage() {
  return <Studio />;
}
