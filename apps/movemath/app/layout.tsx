import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MoveMath — the real cost of moving home in the UK, itemised",
    template: "%s | MoveMath"
  },
  description:
    "Work out the full cost of moving home in England & Northern Ireland: Stamp Duty (SDLT), removals, conveyancing and surveys — every figure an estimate from public sources, date-stamped."
};

const NAV = [
  { label: "Cost calculator", href: "/" },
  { label: "Examples", href: "/buying" },
  { label: "Privacy", href: "/privacy" }
];

/**
 * Organization JSON-LD with `parentOrganization` ("The Math Family"). The shared geo builder does
 * NOT emit parentOrganization, and the package is read-only, so we add it app-locally by spreading
 * the builder's output. (Do NOT edit @mathfamily/geo for this.)
 */
const organizationJsonLd = {
  ...organizationLd({
    siteUrl: SITE_URL,
    name: "MoveMath",
    logoUrl: `${SITE_URL}/opengraph-image`,
    founder: { name: "Michal Latal", jobTitle: "Founder & editor" }
  }),
  parentOrganization: { "@type": "Organization" as const, name: "The Math Family" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={organizationJsonLd} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="MoveMath" brandPrefix="Move" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="MoveMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
