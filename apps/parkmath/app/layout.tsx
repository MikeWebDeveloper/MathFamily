import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ScrollProgress, ScrollReveal, SiteFooter, SiteHeader } from "@mathfamily/ui";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ParkMath — UK airport drop-off & parking costs, verified", template: "%s | ParkMath" },
  description:
    "Current UK airport drop-off charges, parking costs and the free alternatives — every figure verified against official airport pages and date-stamped."
};

const NAV = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Parking", href: "/airport-parking" },
  { label: "Lounges", href: "/airport-lounges" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">
        <ScrollProgress />
        <ScrollReveal />
        <SiteHeader brandName="ParkMath" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="ParkMath" links={NAV} />
        <Analytics />
      </body>
    </html>
  );
}
