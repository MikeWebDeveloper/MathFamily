import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EnergyMath — your UK energy bill on the Ofgem price cap, by region",
    template: "%s | EnergyMath"
  },
  description:
    "Estimate your UK annual gas and electricity bill from the Ofgem price cap by region and home size, and compare a heat pump vs a gas boiler or solar payback — every rate sourced and date-stamped."
};

const NAV = [
  { label: "By region", href: "/region" },
  { label: "Privacy", href: "/privacy" }
];

/** Organization JSON-LD with parentOrganization = The Math Family. Built inline
 *  (the shared organizationLd builder has no parentOrganization field) so the
 *  shared @mathfamily/geo package stays untouched. */
function energyMathOrganizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "EnergyMath",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/opengraph-image` },
    parentOrganization: { "@type": "Organization", name: "The Math Family" },
    founder: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Michal Latal",
      jobTitle: "Founder & editor"
    }
  } as Record<string, unknown>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={energyMathOrganizationLd()} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="EnergyMath" brandPrefix="Energy" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="EnergyMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
