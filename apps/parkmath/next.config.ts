import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * Airports whose /avoid-drop-off-charge/<slug> page doesn't exist: free airports and charging airports
 * with no verified free alternative (lib/avoid-content.ts qualifiesForAvoidPage, kept in step by
 * tests/avoid-redirects.test.ts). A re-verify can remove a free alternative (Cardiff, Nov 2026), and
 * the avoid URL would then 404 and lose its rankings, so it 308s to the airport's drop-off page.
 * Read from the dataset JSON because the config loads before Next transpiles the workspace's TS
 * packages. Fails open to no redirects if the file can't be found.
 */
function airportsWithoutAvoidPage(): string[] {
  const rel = "packages/data/datasets/parkmath/drop-off-fees.json";
  const file = [join(process.cwd(), "../..", rel), join(process.cwd(), rel)].find((f) => existsSync(f));
  if (!file) return [];
  const data = JSON.parse(readFileSync(file, "utf8")) as { records?: unknown[] } | unknown[];
  const records = (Array.isArray(data) ? data : data.records ?? []) as { airportSlug: string; isFree: boolean; freeAlternative: unknown }[];
  return records.filter((r) => r.isFree || r.freeAlternative === null).map((r) => r.airportSlug);
}

// Allowlist the Plausible host (script load + event POST) only when a Plausible domain is configured,
// mirroring SiteAnalytics so a self-hosted instance works without a second CSP edit. Inert until set.
const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  ? ` ${(process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/+$/, "")}`
  : "";

// Allowlist the self-hosted Umami host (beacon load + /api/send POST) when configured. Inert until set.
const umamiHost = process.env.NEXT_PUBLIC_UMAMI_HOST
  ? ` ${process.env.NEXT_PUBLIC_UMAMI_HOST.replace(/\/+$/, "")}`
  : "";

// frame-ancestors directive: 'none' everywhere EXCEPT the embeddable widget routes (/embed/*),
// which must be framable from any third-party site (that's the whole point of the embed widget).
// The embed route handler also sets its own permissive CSP, but the site-wide header() rule below
// would otherwise *also* attach 'none' to it (browsers honour the most restrictive) — so we scope
// the restrictive frame headers to everything-but-/embed and give /embed an explicit permissive set.
const cspBase = (frameAncestors: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://www.dwin1.com${plausibleHost}${umamiHost}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    `connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com${plausibleHost}${umamiHost}`,
    frameAncestors,
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join("; ");

const csp = cspBase("frame-ancestors 'none'");
const cspEmbed = cspBase("frame-ancestors *");

// Headers common to every route (the embed routes get these too, just without the frame lock).
const commonHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@mathfamily/ui", "@mathfamily/engine", "@mathfamily/data", "@mathfamily/geo"],
  async headers() {
    return [
      {
        // Everything except the embeddable widget: locked to no framing.
        source: "/:path((?!embed/).*)",
        headers: [
          ...commonHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp }
        ]
      },
      {
        // The embeddable widget: framable anywhere. No X-Frame-Options (deprecated; CSP wins).
        source: "/embed/:path*",
        headers: [...commonHeaders, { key: "Content-Security-Policy", value: cspEmbed }]
      }
    ];
  },
  // Canonicalise common short URLs that would otherwise 404 — permanent (308) so link equity passes
  // to the canonical. /price-index is the well-known short form of the price-index page; bare airport
  // slugs map to their canonical drop-off-charges page. The airport set mirrors the drop-off dataset
  // (packages/data/datasets/parkmath/drop-off-fees.json) and is constrained inline so a real top-level
  // route (/about, /news, …) is never shadowed. The canonical pages themselves are left untouched.
  async redirects() {
    const dropOffAirports = [
      "heathrow", "gatwick", "manchester", "stansted", "luton", "edinburgh",
      "birmingham", "glasgow", "bristol", "belfast-international", "newcastle",
      "liverpool", "london-city", "leeds-bradford", "east-midlands", "aberdeen",
      "belfast-city", "southampton", "cardiff", "exeter", "southend",
      "bournemouth", "norwich", "inverness", "teesside", "prestwick",
    ];
    return [
      { source: "/price-index", destination: "/drop-off-charges/price-index", permanent: true },
      {
        source: `/:airport(${dropOffAirports.join("|")})`,
        destination: "/drop-off-charges/:airport",
        permanent: true,
      },
      ...airportsWithoutAvoidPage().map((slug) => ({
        source: `/avoid-drop-off-charge/${slug}`,
        destination: `/drop-off-charges/${slug}`,
        permanent: true,
      })),
    ];
  }
};

export default nextConfig;
