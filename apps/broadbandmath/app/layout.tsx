import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { JsonLd, organizationLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BroadbandMath — the real cost of UK broadband, after the price rises",
    template: "%s | BroadbandMath"
  },
  description:
    "What UK broadband actually costs once the mid-contract price rise and out-of-contract price kick in. Advertised price vs real cost, by provider and by speed — figures sourced and date-stamped."
};

const NAV = [
  { label: "By provider", href: "/provider" },
  { label: "By speed", href: "/speed" },
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
            name: "BroadbandMath",
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
        <SiteHeader brandName="BroadbandMath" brandPrefix="Broadband" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="BroadbandMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
