import type { ReachRow } from "../digest";

// Plausible Stats API: visitors broken down by utm_campaign (the grain we tag reels with).
// Cookieless, GDPR-clean. Returns null when not configured (no creds → digest runs without analytics).
// Env: PLAUSIBLE_HOST (e.g. https://plausible.io or a self-host), PLAUSIBLE_API_KEY, PLAUSIBLE_SITE_ID.
export async function plausibleReach(period = "7d"): Promise<ReachRow[] | null> {
  const host = process.env.PLAUSIBLE_HOST;
  const key = process.env.PLAUSIBLE_API_KEY;
  const site = process.env.PLAUSIBLE_SITE_ID;
  if (!host || !key || !site) return null;

  const url =
    `${host.replace(/\/+$/, "")}/api/v1/stats/breakdown?` +
    new URLSearchParams({
      site_id: site,
      period,
      property: "visit:utm_campaign",
      metrics: "visitors",
      limit: "100"
    }).toString();

  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Plausible ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { results: { utm_campaign: string; visitors: number }[] };
  return data.results.map((r) => ({ key: r.utm_campaign, visitors: r.visitors }));
}
