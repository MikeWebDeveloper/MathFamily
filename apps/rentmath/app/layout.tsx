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
  title: {
    default: "RentMath — the true cost of renting in the UK, by town",
    template: "%s | RentMath"
  },
  description:
    "The real annual cost of a UK tenancy — median rent plus council tax, typical bills and the capped deposit — worked out per town. Every figure carries a source and a date."
};

const NAV = [
  { label: "Towns", href: "/towns" },
  { label: "Privacy", href: "/privacy" }
];

/**
 * Adds the parent-org relationship to The Math Family on top of the shared Organization node.
 * The shared `organizationLd` builder (read-only package) does not expose `parentOrganization`,
 * so we emit a second, app-local node keyed to the same @id that carries the relationship.
 */
function parentOrgLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${siteUrl}/#organization`,
    parentOrganization: {
      "@type": "Organization" as const,
      name: "The Math Family",
      url: "https://themathfamily.com"
    }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        {/* No-flash theme script: runs before first paint to avoid white flash in dark mode */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "RentMath", logoUrl: `${SITE_URL}/opengraph-image`, founder: { name: "Michal Latal", jobTitle: "Founder & editor" } })} />
        <JsonLd data={parentOrgLd(SITE_URL)} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="RentMath" brandPrefix="Rent" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="RentMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
