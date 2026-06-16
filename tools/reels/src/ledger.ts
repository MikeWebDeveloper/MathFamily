import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ReelScript } from "./schema";

// Append-only content ledger: the single source of truth for what's been generated, so the
// factory can attribute each reel (UTM) and avoid repeating airports week-over-week. Never
// records an affiliate link — only a first-party parkmath.co.uk UTM landing URL.
export interface LedgerEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  brand: string;
  format: string;
  slug: string;
  hook: string;
  utmCampaign: string;
  landingUrl: string;
  status: "generated" | "posted";
  postedUrl?: string;
}

// Reel format → the on-site page the social post should drive to.
const PATH_BY_FORMAT: Record<string, string> = {
  "shock-fee": "drop-off-charges",
  "how-to": "airport-parking",
  news: "news"
};
const SITE: Record<string, string> = { parkmath: "https://parkmath.co.uk", roammath: "https://roammath.co.uk" };

const yyyymm = (date: string) => date.slice(0, 7).replace("-", "");

export function ledgerId(script: ReelScript, date: string): string {
  return `${script.brand}-${script.format}-${script.slug}-${date.replace(/-/g, "")}`;
}

export function campaignFor(script: ReelScript, date: string): string {
  return `${script.slug}-${yyyymm(date)}`;
}

/** First-party landing URL with UTM tags for social→site→affiliate attribution. Never an affiliate link. */
export function landingUrlFor(script: ReelScript, date: string): string {
  const site = SITE[script.brand] ?? SITE.parkmath;
  const seg = PATH_BY_FORMAT[script.format] ?? "";
  const params = new URLSearchParams({
    utm_source: "social",
    utm_medium: "reel",
    utm_campaign: campaignFor(script, date),
    utm_content: ledgerId(script, date)
  });
  const path = seg ? `/${seg}/${script.slug}` : "";
  return `${site}${path}?${params.toString()}`;
}

export function ledgerEntryFor(script: ReelScript, date: string): LedgerEntry {
  return {
    id: ledgerId(script, date),
    date,
    brand: script.brand,
    format: script.format,
    slug: script.slug,
    hook: script.captions[0] ?? script.narration.slice(0, 80),
    utmCampaign: campaignFor(script, date),
    landingUrl: landingUrlFor(script, date),
    status: "generated"
  };
}

export function readLedger(path: string): LedgerEntry[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LedgerEntry);
}

export function appendEntries(path: string, entries: LedgerEntry[]): void {
  if (entries.length === 0) return;
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

/** Ledger entries generated within the last `days` days (relative to `now`). */
export function recentEntries(entries: LedgerEntry[], days: number, now: string): LedgerEntry[] {
  const cutoff = new Date(`${now}T00:00:00Z`).getTime() - days * 86_400_000;
  return entries.filter((e) => new Date(`${e.date}T00:00:00Z`).getTime() >= cutoff);
}

/** Slugs generated within the last `days` days — for cross-run dedupe. */
export function recentSlugs(entries: LedgerEntry[], days: number, now: string): Set<string> {
  return new Set(recentEntries(entries, days, now).map((e) => e.slug));
}
