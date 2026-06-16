import type { NextConfig } from "next";

// Allowlist the Plausible host (script load + event POST) only when a Plausible domain is configured,
// mirroring SiteAnalytics so a self-hosted instance works without a second CSP edit. Inert until set.
const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  ? ` ${(process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/+$/, "")}`
  : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://www.dwin1.com${plausibleHost}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  `connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com${plausibleHost}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@mathfamily/ui", "@mathfamily/engine", "@mathfamily/data", "@mathfamily/geo"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
