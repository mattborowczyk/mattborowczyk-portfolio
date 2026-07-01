import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mattborowczyk.com"),
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
    <html lang="en" className={`${cormorant.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
