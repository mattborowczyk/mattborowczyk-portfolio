import type { Metadata } from "next";

import LinksHub from "@/components/links-hub";
import { getLinks, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Links",
  description: "mattborowczyk — jewellery & objects.",
  robots: { index: false, follow: false },
};

export default async function LinksPage() {
  const [links, settings] = await Promise.all([getLinks(), getSettings()]);
  return <LinksHub links={links} settings={settings} />;
}
