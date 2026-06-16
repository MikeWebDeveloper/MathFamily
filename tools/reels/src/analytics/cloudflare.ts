import type { ReachRow } from "../digest";

// Cloudflare Web Analytics (RUM) pageviews by path via the GraphQL Analytics API. Returns null when
// not configured. CF Web Analytics has no UTM grain, so this keys reach by request path; the digest
// matches it to a reel via the landing-URL path. Env: CF_API_TOKEN, CF_ZONE_TAG.
// NOTE: not yet verified against a live zone — confirm the dataset/field names on the first real run.
export async function cloudflareReach(periodDays = 7): Promise<ReachRow[] | null> {
  const token = process.env.CF_API_TOKEN;
  const zoneTag = process.env.CF_ZONE_TAG;
  if (!token || !zoneTag) return null;

  const end = new Date();
  const start = new Date(end.getTime() - periodDays * 86_400_000);
  const query =
    `query($zone:String!,$start:Time!,$end:Time!){viewer{zones(filter:{zoneTag:$zone}){` +
    `rumPageloadEventsAdaptiveGroups(limit:500,filter:{datetime_geq:$start,datetime_leq:$end}){` +
    `count dimensions{requestPath}}}}}`;

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { zone: zoneTag, start: start.toISOString(), end: end.toISOString() } })
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    errors?: unknown;
    data?: { viewer?: { zones?: { rumPageloadEventsAdaptiveGroups?: { count: number; dimensions: { requestPath: string } }[] }[] } };
  };
  if (data.errors) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(data.errors)}`);
  const groups = data.data?.viewer?.zones?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  return groups.map((g) => ({ key: g.dimensions.requestPath, visitors: g.count }));
}
