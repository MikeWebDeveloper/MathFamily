import { umamiReach } from "./umami";
import { plausibleReach } from "./plausible";
import { cloudflareReach } from "./cloudflare";
import type { ReachRow } from "../digest";

// Pick whichever analytics source is configured, preferring the ones with UTM-campaign grain
// (Umami → Plausible) over path-only Cloudflare. `campaigns` (from the ledger) lets Umami report
// per-campaign visitors. Returns source "none" + [] when nothing is set, so the digest degrades.
export async function fetchReach(periodDays = 7, campaigns: string[] = []): Promise<{ source: string; rows: ReachRow[] }> {
  const u = await umamiReach(periodDays, campaigns);
  if (u) return { source: "umami", rows: u };
  const p = await plausibleReach(`${periodDays}d`);
  if (p) return { source: "plausible", rows: p };
  const c = await cloudflareReach(periodDays);
  if (c) return { source: "cloudflare", rows: c };
  return { source: "none", rows: [] };
}
