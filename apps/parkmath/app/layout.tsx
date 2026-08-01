import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, GlintController, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", preload: false });

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

// 2026-08-02 CRO/nav pass (company board `parkmath-cro-review-2026-08-02.md`, findings A/E/rec #3/#7):
// this NAV constant is parkmath-only config passed into the shared <SiteHeader>/<SiteFooter> — editing
// it changes nothing for roammath/loungemath/energymath, which each pass their own NAV/FOOTER_NAV
// arrays into the same components (verified: packages/ui/src/site-header.tsx takes `links` as a prop,
// no shared/hardcoded nav copy anywhere in the package).
//
// Two fixes bundled with the one addition the brief asked for, both ground-truthed against the actual
// routes before editing:
//  - "Park vs drop-off" previously pointed at /airport-parking-options (the options/comparison-table
//    hub) — but a dedicated /parking-vs-drop-off hub page already exists and was reachable from
//    NOWHERE in the nav. Repointed the label to its actual page instead of leaving it a duplicate of
//    the new "Compare parking" link below.
//  - "Parking" was ambiguous against "Drop-off charges" (finding E) — relabelled "Parking prices" to
//    describe what /airport-parking actually is (gate vs pre-book tariffs), not what it does.
const NAV = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Park vs drop-off", href: "/parking-vs-drop-off" },
  { label: "Parking prices", href: "/airport-parking" },
  { label: "Compare parking", href: "/airport-parking-options" },
  { label: "Lounges", href: "/airport-lounges" },
  { label: "About", href: "/about" }
];

// Footer carries the full set, including the E-E-A-T trust pages and legal.
const FOOTER_NAV = [
  { label: "Drop-off charges", href: "/drop-off-charges" },
  { label: "Park vs drop-off", href: "/parking-vs-drop-off" },
  { label: "Parking prices", href: "/airport-parking" },
  { label: "Compare parking", href: "/airport-parking-options" },
  { label: "Lounges", href: "/airport-lounges" },
  { label: "About", href: "/about" },
  { label: "How we verify", href: "/methodology" },
  { label: "Embed our data", href: "/embed" },
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
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to content</a>
        {/* Organization + founder graph, emitted site-wide. founder.sameAs is intentionally
            omitted until Mike confirms a real profile URL — we never invent social links.
            [Mike to confirm]: add e.g. ["https://www.linkedin.com/in/…"] to founder.sameAs. */}
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "ParkMath", logoUrl: `${SITE_URL}/opengraph-image`, founder: { name: "Mike", jobTitle: "Founder & editor" } })} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <GlintController />
        <AmbientBackdrop />
        <SiteHeader brandName="ParkMath" brandPrefix="Park" links={NAV} />
        <main id="main" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="ParkMath" links={FOOTER_NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
