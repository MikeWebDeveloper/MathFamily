// Pure logic for the ParkMath site + deeplink watchdog — no network, no secrets, no deps.
// Unit-tested in lib.test.mjs (run: node --test tools/watchdog/*.test.mjs). The runner (check.mjs) does the
// actual fetching; everything here is deterministic and safe to call anywhere.

export const DEFAULT_BASE_URL = "https://parkmath.co.uk";

// Mirror of apps/parkmath/lib/parking-content.ts:DURATION_SLUGS — keep in sync.
export const DURATION_SLUGS = ["3-days", "7-days", "14-days"];

/** Normalize a dataset JSON (bare array | {records:[...]} | {items:[...]}) to its records array. */
export function recordsOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.records)) return data.records;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

/** Build the list of live ParkMath routes ({path, kind}) to health-check, derived from the datasets.
 *  Per-section airports come from each dataset's own records (parking/lounges are subsets of all 25). */
export function enumerateRoutes({ airports, dropOff, parking, lounges, news, durationSlugs = DURATION_SLUGS }) {
  void airports; // reserved; routes derive from per-section datasets so we never 404 a missing record
  const routes = [
    { path: "/", kind: "hub" },
    { path: "/drop-off-charges", kind: "hub" },
    { path: "/airport-parking", kind: "hub" },
    { path: "/airport-lounges", kind: "hub" },
    { path: "/news", kind: "hub" },
  ];
  for (const r of recordsOf(dropOff)) routes.push({ path: `/drop-off-charges/${r.airportSlug}`, kind: "drop-off" });
  for (const r of recordsOf(parking)) {
    routes.push({ path: `/airport-parking/${r.airportSlug}`, kind: "parking" });
    for (const d of durationSlugs) routes.push({ path: `/airport-parking/${r.airportSlug}/${d}`, kind: "parking-duration" });
  }
  for (const r of recordsOf(lounges)) routes.push({ path: `/airport-lounges/${r.airportSlug}`, kind: "lounge" });
  for (const r of recordsOf(news)) routes.push({ path: `/news/${r.id}`, kind: "news" });
  return routes;
}

/** Port of apps/parkmath/lib/partners.ts:buildAwinLink — MUST stay byte-identical in output. */
export function buildAwinLink({ awinmid, publisherId, airportSlug, ued, clickrefSuffix }) {
  const params = new URLSearchParams({
    awinmid,
    awinaffid: publisherId,
    clickref: `parkmath-${airportSlug}${clickrefSuffix ? `-${clickrefSuffix}` : ""}`,
  });
  if (ued) params.set("ued", ued);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

/** Structural check of a built deeplink against the AWIN contract. Returns problems[] (empty = ok).
 *  Never makes a request — this validates the string only. */
export function validateDeeplink(url, { activeMids, publisherId, expectedUed }) {
  let u;
  try { u = new URL(url); } catch { return ["unparseable URL"]; }
  const problems = [];
  if (u.host !== "www.awin1.com" || u.pathname !== "/cread.php") problems.push(`wrong host/path: ${u.host}${u.pathname}`);
  const q = u.searchParams;
  if (!activeMids.has(q.get("awinmid"))) problems.push(`awinmid ${q.get("awinmid")} not an active mid`);
  if (q.get("awinaffid") !== publisherId) problems.push(`awinaffid ${q.get("awinaffid")} !== ${publisherId}`);
  if (!/^parkmath-[a-z0-9-]+$/.test(q.get("clickref") ?? "")) problems.push(`bad clickref: ${q.get("clickref")}`);
  if (expectedUed !== undefined && q.get("ued") !== expectedUed) problems.push("ued mismatch");
  return problems;
}

/** Active partners (active + awinmid) with their ued destinations, read from partners.json shape.
 *  destinations[].surface is the clickref suffix (null for the bare landingUrl link). */
export function activePartners(partnersJson) {
  const out = [];
  for (const [slug, p] of Object.entries(partnersJson.partners ?? {})) {
    if (!p.active || !p.awinmid) continue;
    const destinations = [];
    if (p.landingUrl) destinations.push({ surface: null, url: p.landingUrl });
    for (const [product, entry] of Object.entries(p.products ?? {})) destinations.push({ surface: product, url: entry.url });
    out.push({ slug, name: p.name, awinmid: p.awinmid, destinations });
  }
  return out;
}

/** Every deeplink the site can emit (active partners × airports × destinations), for structural checks. */
export function expectedDeeplinks({ partnersJson, airportSlugs }) {
  const publisherId = partnersJson.awin.publisherId;
  const links = [];
  for (const partner of activePartners(partnersJson)) {
    for (const slug of airportSlugs) {
      for (const dest of partner.destinations) {
        links.push({
          partner: partner.slug, airport: slug, surface: dest.surface,
          url: buildAwinLink({ awinmid: partner.awinmid, publisherId, airportSlug: slug, ued: dest.url, clickrefSuffix: dest.surface ?? undefined }),
          expectedUed: dest.url,
        });
      }
    }
  }
  return links;
}

/** Distinct ued destination URLs to probe for liveness. These are the merchant landing pages —
 *  NEVER awin1.com/cread.php (firing the tracker would register phantom affiliate clicks). */
export function destinationUrls(partnersJson) {
  const set = new Set();
  for (const partner of activePartners(partnersJson)) for (const dest of partner.destinations) set.add(dest.url);
  return [...set];
}

// ---- plumbing: the measurement pipes -------------------------------------------------------------
// In Nov 2026 three of them broke silently for 1-2 weeks each (AWIN token expired, the self-hosted Umami
// went down with its Docker host, RoamMath shipped with no analytics beacon). These checks make the
// watchdog's rolling issue say so. They are read-only: page HTML, the Umami script/login endpoints and the
// AWIN *API* (api.awin.com) — never the awin1.com click tracker.

// Mirror of apps/roammath/lib/site.ts:PRODUCTION_SITE_URL — a unit test keeps the two in sync.
export const DEFAULT_ROAMMATH_URL = "https://www.roammath.co.uk";

/** What the issue body tells Mike to do for each failing plumbing check (no secrets, no hostnames of the Mac). */
export const PLUMBING_FIX = {
  "umami-host": "Umami (affiliate-click + page analytics) is unreachable. Start OrbStack on the Mac (Umami runs in its Docker container) and set OrbStack to open at login.",
  "umami-auth": "Affiliate-click counts can't be read from Umami. If umami-host is failing too, fix that first; otherwise log in to Umami and update UMAMI_USER/UMAMI_PASSWORD in tools/reels/analytics.env.",
  "cf-beacon-parkmath": "No Cloudflare Web Analytics beacon on parkmath.co.uk. Set NEXT_PUBLIC_CF_BEACON_TOKEN in the ParkMath Vercel project and redeploy.",
  "cf-beacon-roammath": "No Cloudflare Web Analytics beacon on roammath.co.uk, so its traffic is invisible. Set NEXT_PUBLIC_CF_BEACON_TOKEN in the RoamMath Vercel project and redeploy.",
  "awin-token": "The AWIN API token is rejected, so revenue and programme status can't be read. Regenerate it at https://ui.awin.com/awin-api and update AWIN_API_TOKEN in tools/awin/.env.",
};

/** Find the analytics tags SiteAnalytics renders: the Cloudflare beacon and the Umami script (src of the
 *  <script> that carries data-website-id). Pure string parsing — attribute order doesn't matter. */
export function analyticsTags(html) {
  const cfBeacon = /static\.cloudflareinsights\.com\/beacon\.min\.js/.test(html);
  let umamiScript = null;
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    if (!/data-website-id=/i.test(tag)) continue;
    const src = tag.match(/\ssrc=["']([^"']+)["']/i);
    if (src) { umamiScript = src[1]; break; }
  }
  return { cfBeacon, umamiScript };
}

/** Minimal .env reader (KEY=VALUE, optional `export `, optional quotes; comments/blank/broken lines ignored). */
export function parseEnvFile(text) {
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, "");
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[line.slice(0, eq).trim()] = value;
  }
  return env;
}

/** AWIN /accounts answer → plumbing verdict. 429 is rate limiting, not an outage. */
export function judgeAwinStatus(status) {
  if (status === 200 || status === 429) return { ok: true, detail: `AWIN API answered HTTP ${status}` };
  if (status === 401 || status === 403) return { ok: false, detail: `AWIN API answered HTTP ${status}: the token is invalid or expired` };
  return { ok: false, detail: `AWIN API answered HTTP ${status ?? "no response"}` };
}

/** Umami /api/auth/login answer → plumbing verdict (null status = network error / timeout). */
export function judgeUmamiLogin(status) {
  if (status === 200) return { ok: true, detail: "Umami login works" };
  if (status === 401 || status === 403) return { ok: false, detail: `Umami login answered HTTP ${status}: the stored password is stale` };
  return { ok: false, detail: `Umami API unreachable (${status ? `HTTP ${status}` : "no response"})` };
}

/** Combine page + destination + structural (+ plumbing) results into a pass/fail summary.
 *  A plumbing result with `skipped: true` (its secrets file isn't on this machine, e.g. CI) is listed in
 *  `skipped` and is neither a failure nor counted as a check. */
export function classifyResults({ pageResults, destResults, deeplinkProblems, plumbingResults = [] }) {
  const failures = [];
  const skipped = [];
  for (const r of pageResults) if (!r.ok) failures.push({ type: "page", path: r.path, detail: r.detail });
  for (const r of destResults) if (!r.ok) failures.push({ type: "destination", url: r.url, detail: r.detail });
  for (const p of deeplinkProblems) failures.push({ type: "deeplink", url: p.url, detail: p.problems.join("; ") });
  let plumbingChecked = 0;
  for (const r of plumbingResults) {
    if (r.skipped) { skipped.push({ name: r.name, detail: r.detail }); continue; }
    plumbingChecked += 1;
    if (!r.ok) failures.push({ type: "plumbing", name: r.name, detail: r.detail, fix: PLUMBING_FIX[r.name] });
  }
  return { ok: failures.length === 0, failures, skipped, checked: pageResults.length + destResults.length + plumbingChecked };
}

/** Markdown body for docs/reports/watchdog-<date>.md (written on failure only). */
export function formatReport({ date, summary }) {
  const lines = [
    `# 🔴 ParkMath watchdog — ${date}`, "",
    `${summary.failures.length} failing of ${summary.checked} checks.`, "",
  ];
  for (const f of summary.failures) {
    if (f.type === "page") lines.push(`- **page** \`${f.path}\` — ${f.detail}`);
    else if (f.type === "destination") lines.push(`- **affiliate destination** ${f.url} — ${f.detail}`);
    else if (f.type === "plumbing") lines.push(`- **measurement** \`${f.name}\` — ${f.detail}. Fix: ${f.fix ?? "see tools/watchdog/README.md"}`);
    else lines.push(`- **deeplink** \`${f.url}\` — ${f.detail}`);
  }
  if (summary.skipped?.length) {
    lines.push("", "Skipped (no credentials on this machine): " + summary.skipped.map((s) => `\`${s.name}\``).join(", "));
  }
  return lines.join("\n") + "\n";
}
