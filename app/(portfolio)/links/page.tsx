import type { Metadata } from "next";

import LinksHub from "@/components/links-hub";
import { getLinks } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Links",
  description: "mattborowczyk — jewellery & objects.",
  robots: { index: false, follow: false },
};

export default async function LinksPage() {
  const items = await getLinks();
  return <LinksHub items={items} />;
}
