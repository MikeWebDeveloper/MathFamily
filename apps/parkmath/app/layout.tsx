import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ParkMath — UK airport drop-off & parking costs, verified", template: "%s | ParkMath" },
  description:
    "Current UK airport drop-off charges, parking costs and the free alternatives — every figure verified against official airport pages and date-stamped.",
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/news/feed.xml" }
  },
  openGraph: {
    type: "website",
    siteName: "ParkMath",
    locale: "en_GB",
    url: SITE_URL
  }
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
      <body className="relative bg-white font-sans text-ink antialiased">
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "ParkMath", logoUrl: `${SITE_URL}/opengraph-image` })} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="ParkMath" brandPrefix="Park" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="ParkMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
