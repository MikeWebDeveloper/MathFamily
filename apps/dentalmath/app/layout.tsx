import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "DentalMath — NHS vs private dental costs in the UK, verified", template: "%s | DentalMath" },
  description:
    "What NHS and private dental treatment really costs in the UK — NHS band charges vs typical private prices for check-ups, fillings, crowns and more, verified against official sources."
};

const NAV = [
  { label: "Treatments", href: "/treatments" },
  { label: "NHS charges", href: "/nhs-dental-charges" },
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
        <JsonLd
          data={organizationLd({
            siteUrl: SITE_URL,
            name: "DentalMath",
            logoUrl: `${SITE_URL}/opengraph-image`,
            founder: { name: "Michal Latal", jobTitle: "Founder & editor" }
          })}
        />
        {/* DentalMath is part of The Math Family — declare the parent organisation for GEO/E-E-A-T. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "DentalMath",
            parentOrganization: { "@type": "Organization", name: "The Math Family" }
          }}
        />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="DentalMath" brandPrefix="Dental" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="DentalMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
