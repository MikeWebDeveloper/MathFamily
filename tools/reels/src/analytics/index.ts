import { plausibleReach } from "./plausible";
import { cloudflareReach } from "./cloudflare";
import type { ReachRow } from "../digest";

// Pick whichever analytics source is configured (Plausible preferred — it has the UTM grain).
// Returns source "none" + [] when nothing is set, so the digest degrades gracefully.
export async function fetchReach(periodDays = 7): Promise<{ source: string; rows: ReachRow[] }> {
  const p = await plausibleReach(`${periodDays}d`);
  if (p) return { source: "plausible", rows: p };
  const c = await cloudflareReach(periodDays);
  if (c) return { source: "cloudflare", rows: c };
  return { source: "none", rows: [] };
}
