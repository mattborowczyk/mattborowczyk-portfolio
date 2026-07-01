"use client";

/**
 * Client boundary for the embedded Sanity Studio. Keeping the config +
 * NextStudio import on the client side prevents Sanity's client-only code
 * (styled-components / React context) from being evaluated during the
 * server build. (Studio relocates to /admin in Phase 3.)
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export function Studio() {
  return <NextStudio config={config} />;
}
