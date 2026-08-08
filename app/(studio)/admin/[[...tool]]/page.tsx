/**
 * Embedded Sanity Studio at /admin (moved off /studio, which is now the
 * public Studio page).
 *
 * The config + NextStudio live in a client component (./Studio) so Sanity's
 * client-only code is not evaluated on the server during the build.
 */
import { Studio } from "./Studio";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sanity Studio",
  robots: "noindex",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = "force-static";

export default function StudioPage() {
  return <Studio />;
}
