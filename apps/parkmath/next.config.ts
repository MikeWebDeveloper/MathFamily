import type { NextConfig } from "next";

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
  }
};

export default nextConfig;
