import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RoamMath — what your phone and bags cost abroad, verified", template: "%s | RoamMath" },
  description:
    "UK mobile roaming charges per network per country, eSIM comparisons and airline baggage fees — every figure verified against official pages and date-stamped.",
  alternates: { canonical: "/" }
};

const NAV = [
  { label: "Roaming charges", href: "/roaming" },
  { label: "Baggage fees", href: "/baggage-fees" },
  { label: "Privacy", href: "/privacy" }
];

// Footer carries the full set, including the "How we verify" E-E-A-T page that the
// header nav omits to keep the primary nav short.
const FOOTER_NAV = [
  { label: "Roaming charges", href: "/roaming" },
  { label: "Baggage fees", href: "/baggage-fees" },
  { label: "How we verify", href: "/methodology" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        {/* No-flash theme script: runs before first paint to avoid white flash in dark mode */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "RoamMath", logoUrl: `${SITE_URL}/opengraph-image`, founder: { name: "Michal Latal", jobTitle: "Founder & editor" } })} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="RoamMath" brandPrefix="Roam" links={NAV} />
        <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="RoamMath" links={FOOTER_NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
