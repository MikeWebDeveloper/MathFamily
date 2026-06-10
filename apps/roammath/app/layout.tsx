import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ScrollProgress, ScrollReveal, SiteFooter, SiteHeader } from "@mathfamily/ui";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RoamMath — what your phone and bags cost abroad, verified", template: "%s | RoamMath" },
  description:
    "UK mobile roaming charges per network per country, eSIM comparisons and airline baggage fees — every figure verified against official pages and date-stamped."
};

const NAV = [
  { label: "Roaming charges", href: "/roaming" },
  { label: "Baggage fees", href: "/baggage-fees" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">
        <ScrollProgress />
        <ScrollReveal />
        <SiteHeader brandName="RoamMath" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="RoamMath" links={NAV} />
        <Analytics />
      </body>
    </html>
  );
}
