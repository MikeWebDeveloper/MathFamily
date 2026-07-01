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
  title: { default: "LoungeMath — per-airport airport-lounge access rules and break-even, UK, verified", template: "%s | LoungeMath" },
  description:
    "per-airport airport-lounge access rules and break-even, UK — every figure verified against the official source and date-stamped."
};

const NAV = [
  { label: "Airport lounges", href: "/lounge-access" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(e){}})();` }} />
      </head>
      <body className="relative bg-surface font-sans text-ink antialiased">
        <JsonLd data={organizationLd({ siteUrl: SITE_URL, name: "LoungeMath", logoUrl: `${SITE_URL}/opengraph-image`, founder: { name: "Michal Latal", jobTitle: "Founder & editor" } })} />
        <noscript><style>{`.mf-reveal{opacity:1;transform:none;transition:none}`}</style></noscript>
        <ScrollProgress />
        <ScrollReveal />
        <AmbientBackdrop />
        <SiteHeader brandName="LoungeMath" brandPrefix="Lounge" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="LoungeMath" links={NAV} />
        {/* Cross-sell credit (Mike's decision): nofollow "Built by" attribution. */}
        <div className="mx-auto max-w-5xl px-4 pb-8 text-xs text-ink-muted">
          Built by{" "}
          <a
            href="https://mikewebdeveloper.com"
            rel="nofollow"
            className="underline underline-offset-4 hover:text-brand-accent"
          >
            mikewebdeveloper
          </a>
          .
        </div>
        <SiteAnalytics />
      </body>
    </html>
  );
}
