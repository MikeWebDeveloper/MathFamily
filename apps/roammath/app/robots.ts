import type { MetadataRoute } from "next";

// Explicitly allow the AI answer-engine crawlers (they feed ChatGPT Search,
// Perplexity, Claude and Google AI Overviews — being cited there is the product).
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
