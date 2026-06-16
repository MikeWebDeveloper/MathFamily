import type { ReachRow } from "../digest";

// Umami (self-hosted) reach reader for the reel loop digest. Returns null when not configured.
// Umami captures UTM, so this keys reach BOTH by request path (metrics type=path) and by
// utm_campaign (one stats call per known campaign, filtered with utmCampaign) — giving the digest
// real per-reel attribution that Cloudflare's RUM can't. The digest matches a reel on utm_campaign
// first, then landing path. Self-hosted Umami auths with username/password (no API keys).
// Env: UMAMI_HOST, UMAMI_WEBSITE_ID, UMAMI_USER, UMAMI_PASSWORD.
export async function umamiReach(periodDays = 7, campaigns: string[] = []): Promise<ReachRow[] | null> {
  const host = process.env.UMAMI_HOST?.replace(/\/+$/, "");
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  const user = process.env.UMAMI_USER;
  const password = process.env.UMAMI_PASSWORD;
  if (!host || !websiteId || !user || !password) return null;

  const end = Date.now();
  const start = end - periodDays * 86_400_000;

  const login = await fetch(`${host}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password })
  });
  if (!login.ok) throw new Error(`Umami login ${login.status}: ${await login.text()}`);
  const token = ((await login.json()) as { token?: string }).token;
  if (!token) throw new Error("Umami login returned no token");
  const auth = { Authorization: `Bearer ${token}` };

  // Path-grain: visitors per URL path.
  const mRes = await fetch(
    `${host}/api/websites/${websiteId}/metrics?type=path&startAt=${start}&endAt=${end}&limit=500`,
    { headers: auth }
  );
  if (!mRes.ok) throw new Error(`Umami metrics ${mRes.status}: ${await mRes.text()}`);
  const paths = (await mRes.json()) as { x: string; y: number }[];
  const rows: ReachRow[] = paths.map((p) => ({ key: p.x, visitors: p.y }));

  // UTM grain: one stats call per known campaign (from the ledger), filtered by utmCampaign.
  for (const c of [...new Set(campaigns)].filter(Boolean)) {
    const sRes = await fetch(
      `${host}/api/websites/${websiteId}/stats?startAt=${start}&endAt=${end}&utmCampaign=${encodeURIComponent(c)}`,
      { headers: auth }
    );
    if (!sRes.ok) continue;
    const s = (await sRes.json()) as { visitors?: number };
    if (s.visitors && s.visitors > 0) rows.push({ key: c, visitors: s.visitors });
  }
  return rows;
}
