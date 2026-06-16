import type { ReachRow } from "../digest";

// Cloudflare Web Analytics (RUM) pageviews by path via the GraphQL Analytics API. Returns null when
// not configured. CF Web Analytics has no UTM grain, so this keys reach by request path; the digest
// matches it to a reel via the landing-URL path.
//
// IMPORTANT: Web Analytics is the RUM dataset, which is scoped to an ACCOUNT + SITE, not a zone.
//   - viewer.accounts(filter:{accountTag})  — NOT viewer.zones(zoneTag)
//   - rumPageloadEventsAdaptiveGroups(filter:{siteTag, ...})
// The siteTag is NOT the page's data-cf-beacon token — it's a separate identifier (the siteTag
// dimension in the RUM dataset). Derive it by grouping rumPageloadEventsAdaptiveGroups by siteTag
// and picking the one whose top requestPaths are this site's routes.
// Env: CF_API_TOKEN (Account Analytics:Read), CF_ACCOUNT_TAG (Account ID), CF_SITE_TAG.
export async function cloudflareReach(periodDays = 7): Promise<ReachRow[] | null> {
  const token = process.env.CF_API_TOKEN;
  const accountTag = process.env.CF_ACCOUNT_TAG;
  const siteTag = process.env.CF_SITE_TAG;
  if (!token || !accountTag || !siteTag) return null;

  const end = new Date();
  const start = new Date(end.getTime() - periodDays * 86_400_000);
  const query =
    `query($account:String!,$site:String!,$start:Time!,$end:Time!){viewer{accounts(filter:{accountTag:$account}){` +
    `rumPageloadEventsAdaptiveGroups(limit:500,filter:{siteTag:$site,datetime_geq:$start,datetime_leq:$end}){` +
    `count dimensions{requestPath}}}}}`;

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { account: accountTag, site: siteTag, start: start.toISOString(), end: end.toISOString() }
    })
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    errors?: unknown;
    data?: { viewer?: { accounts?: { rumPageloadEventsAdaptiveGroups?: { count: number; dimensions: { requestPath: string } }[] }[] } };
  };
  if (data.errors) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(data.errors)}`);
  const groups = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  return groups.map((g) => ({ key: g.dimensions.requestPath, visitors: g.count }));
}
