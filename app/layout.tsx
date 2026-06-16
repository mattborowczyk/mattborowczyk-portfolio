import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mateusz Borowczyk — Jewellery",
    template: "%s | Mateusz Borowczyk",
  },
  description:
    "Handcrafted jewellery by Mateusz Borowczyk — portfolio, collections, and courses.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Mateusz Borowczyk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
