import type { Metadata } from "next";

import LinksHub from "@/components/links-hub";

export const metadata: Metadata = {
  title: "Links",
  description: "mattborowczyk — jewellery & objects.",
  robots: { index: false, follow: false },
};

export default function LinksPage() {
  return <LinksHub />;
}
