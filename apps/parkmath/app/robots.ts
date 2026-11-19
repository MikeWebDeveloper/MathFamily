import type { MetadataRoute } from "next";

// Explicitly allow the AI answer-engine crawlers (they feed ChatGPT Search,
// Perplexity, Claude and Google AI Overviews — being cited there is the product).
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];

// /go/* is the first-party affiliate-click redirect (302 to an AWIN deep link). It is not content, and a
// crawler following it fires the partner's tracker (phantom clicks). A user-agent group that names its own
// rules ignores the "*" group, so the disallow is repeated on every group. Same rule as RoamMath.
const DISALLOW = ["/go/"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
