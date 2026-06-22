import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AmbientBackdrop, ScrollProgress, ScrollReveal, SiteAnalytics, SiteFooter, SiteHeader } from "@mathfamily/ui";
import { JsonLd } from "@mathfamily/geo";
import { petmathOrganizationLd } from "@/lib/org-ld";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PetMath — what a pet really costs over its lifetime, UK", template: "%s | PetMath" },
  description:
    "The lifetime cost of owning a dog, cat or rabbit in the UK — food, vet care and one-off set-up — built from PDSA figures with a source and a verified date on every number."
};

const NAV = [
  { label: "Pet costs", href: "/cost" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={petmathOrganizationLd({ siteUrl: SITE_URL, name: "PetMath", logoUrl: `${SITE_URL}/opengraph-image`, founder: { name: "Michal Latal", jobTitle: "Founder & editor" } })} />
        <noscript>
          <style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style>
        </noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="PetMath" brandPrefix="Pet" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="PetMath" links={NAV} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
