import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SiteFooter, SiteHeader } from "@mathfamily/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Not exported: Next.js layouts only allow framework-known exports.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RoamMath — what your phone and bags cost abroad, verified", template: "%s | RoamMath" },
  description:
    "UK mobile roaming charges per network per country, eSIM comparisons and airline baggage fees — every figure verified against official pages and date-stamped."
};

const NAV = [
  { label: "Roaming charges", href: "/roaming" },
  { label: "Baggage fees", href: "/baggage-fees" },
  { label: "Privacy", href: "/privacy" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body className="bg-white font-sans text-ink antialiased">
        <SiteHeader brandName="RoamMath" links={NAV} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SiteFooter brandName="RoamMath" links={NAV} />
        <Analytics />
      </body>
    </html>
  );
}
