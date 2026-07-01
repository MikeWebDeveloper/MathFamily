import type { MetadataRoute } from "next";

// Explicitly allow the AI answer-engine crawlers (they feed ChatGPT Search,
// Perplexity, Claude and Google AI Overviews — being cited there is the product).
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";
  return {
    rules: [
      // /go is the affiliate-redirect surface: never index it (no SEO value, keeps
      // the affiliate hop out of the crawl graph). Everything else is allowed.
      { userAgent: "*", allow: "/", disallow: "/go/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/go/" }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
