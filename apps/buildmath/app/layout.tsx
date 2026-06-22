import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { organizationLd, JsonLd } from "@mathfamily/geo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BuildMath — what a UK extension or renovation really costs",
    template: "%s | BuildMath"
  },
  description:
    "UK extension, loft, kitchen and bathroom build costs by region and finish level — regional £/m² ranges from public cost guides, every figure sourced and date-stamped."
};

const NAV = [
  { label: "Project costs", href: "/cost" },
  { label: "Costs by region", href: "/regions" },
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
            name: "BuildMath",
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
        <SiteHeader brandName="BuildMath" brandPrefix="Build" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="BuildMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
