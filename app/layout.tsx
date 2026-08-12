import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";

import { BASE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Only the weights the site actually sets: Cormorant at 400 (its default, in
 * the display sizes) and 500 (`font-medium`, the headings), IBM Plex Mono only
 * ever at 400. `font-bold` appears on `font-sans`, which is Helvetica Neue and
 * comes from the system, so it costs nothing here.
 *
 * Worth listing honestly, because the two families answer differently. Google
 * serves Cormorant Garamond as a variable font, so its weights share one file
 * and asking for a third was free; IBM Plex Mono comes as static instances, one
 * file per weight, each preloaded from the document head ahead of the images —
 * dropping its unused 500 took a real 10 KB request off the critical path.
 *
 * Adding a weight class in a component means adding the weight here, or the
 * browser will synthesise it. Whether that costs a request depends on which
 * family it lands on; check the preload count rather than assuming.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "mattborowczyk — Jewellery & Objects",
    template: "%s — mattborowczyk",
  },
  description:
    "Hand-made silver & gold jewellery and objects by Matt Borowczyk — signet rings, lighter cases, belt buckles, napkin rings and pendants. Made to order.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "mattborowczyk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `en-GB`, matching the copy and the `en_GB` already declared to Open
    // Graph — it is what a screen reader picks a voice and a pronunciation
    // dictionary from, and the site is written in British English throughout.
    <html
      lang="en-GB"
      className={`${cormorant.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
