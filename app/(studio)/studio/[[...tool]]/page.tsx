/**
 * Embedded Sanity Studio at /studio
 *
 * This file is intentionally minimal — the studio renders itself.
 * Access it at http://localhost:3000/studio during development.
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-dynamic";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
