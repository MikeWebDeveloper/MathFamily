import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/site";

// Explicitly allow the AI answer-engine crawlers (they feed ChatGPT Search,
// Perplexity, Claude and Google AI Overviews — being cited there is the product).
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Bingbot"];

// /go/* is the first-party affiliate-click redirect (302 to a partner). It is not content, and a crawler
// following it would register phantom clicks and hit partner trackers. A user-agent group that names its
// own rules ignores the "*" group, so the disallow must be repeated on every group.
const DISALLOW = ["/go/"];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW }))
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
