import { recentNews } from "@mathfamily/data";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const items = recentNews(30);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>ParkMath — UK airport updates</title>
<link>${base}/news</link>
<description>Dated, official-sourced updates to UK airport drop-off, parking and lounge costs and operations.</description>
${items.map((i) => `<item>
<title>${esc(i.title)}</title>
<link>${base}/news/${i.id}</link>
<guid isPermaLink="true">${base}/news/${i.id}</guid>
<pubDate>${new Date(`${i.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
<description>${esc(i.summary)}</description>
</item>`).join("\n")}
</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
