import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { JsonLd, organizationLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd
          data={organizationLd({
            siteUrl: SITE_URL,
            name: "EnergyMath",
            logoUrl: `${SITE_URL}/opengraph-image`,
            founder: { name: "Michal Latal", jobTitle: "Founder & editor" },
            parentOrganization: { name: "The Math Family", url: "https://themathfamily.com" }
          })}
        />
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
