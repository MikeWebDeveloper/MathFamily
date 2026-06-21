#!/usr/bin/env node
/**
 * IndexNow submission. After a PRODUCTION build, pings Bing/Yandex/Seznam/Naver with
 * ParkMath's URLs so new/changed pages get crawled fast (Bing's index feeds ChatGPT Search).
 *
 * Wired into the build script (`next build && node indexnow.mjs`). It no-ops unless
 * NEXT_PUBLIC_SITE_URL is a real production origin, so local/CI/preview builds never submit.
 * It also never throws — a failed ping must not break a deploy.
 *
 * The key is PUBLIC by design: it is also served at /<KEY>.txt, which is how IndexNow verifies
 * ownership. It is NOT a secret and is intentionally committed (no env var needed).
 * Set INDEXNOW_DRY_RUN=1 to print the payload without submitting.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = "c3007763a3af309b550dc00e70ed6b68"; // must match apps/parkmath/public/<KEY>.txt
const BASE = process.env.NEXT_PUBLIC_SITE_URL;
const DRY_RUN = process.env.INDEXNOW_DRY_RUN === "1";

if (!BASE || BASE.includes("localhost")) {
  console.log("IndexNow: skipped (NEXT_PUBLIC_SITE_URL is not a production URL).");
  process.exit(0);
}

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "packages", "data", "datasets", "parkmath");
const DURATIONS = ["3-days", "7-days", "14-days"];

function read(file) {
  try {
    const json = JSON.parse(readFileSync(join(DATA, file), "utf8"));
    if (Array.isArray(json)) return json;
    return json.records ?? json.items ?? [];
  } catch (e) {
    console.warn(`IndexNow: could not read ${file} — ${e.message}`);
    return [];
  }
}

const slugs = (file) => read(file).map((r) => r.airportSlug).filter(Boolean);
const dropOffRecords = read("drop-off-fees.json");
const parkingRecords = read("parking-tariffs.json");
const dropOff = dropOffRecords.map((r) => r.airportSlug).filter(Boolean);
const parking = parkingRecords.map((r) => r.airportSlug).filter(Boolean);
const lounges = slugs("lounges.json");
const news = read("news.json").map((r) => r.id).filter(Boolean);

// Mirror app/sitemap.ts so every indexable cluster page also gets pinged.
// "avoid the drop-off charge": airports that charge AND publish a free alternative.
const avoid = dropOffRecords
  .filter((r) => !r.isFree && r.freeAlternative != null)
  .map((r) => r.airportSlug)
  .filter(Boolean);

// "blue badge": every airport that carries a populated Blue Badge drop-off policy (all 25).
const blueBadge = dropOffRecords
  .filter((r) => typeof r.blueBadgePolicy === "string" && r.blueBadgePolicy.trim().length > 0)
  .map((r) => r.airportSlug)
  .filter(Boolean);

// "parking vs drop-off": charging airports (with a band price) that also have a 7-day gate parking price.
const parkingVsDropOff = dropOffRecords
  .filter((d) => {
    if (d.isFree || (d.bands?.[0]?.totalPence ?? null) === null) return false;
    const p = parkingRecords.find((r) => r.airportSlug === d.airportSlug);
    return Boolean(
      p?.products?.some((prod) => prod.productType === "gate" && prod.prices?.some((pr) => pr.days === 7))
    );
  })
  .map((d) => d.airportSlug)
  .filter(Boolean);

const urls = [
  ...new Set([
    BASE,
    `${BASE}/llms.txt`,
    `${BASE}/parking-price-index-2026`,
    `${BASE}/drop-off-charges`,
    `${BASE}/avoid-drop-off-charge`,
    `${BASE}/blue-badge`,
    `${BASE}/parking-vs-drop-off`,
    `${BASE}/airport-parking`,
    `${BASE}/airport-lounges`,
    `${BASE}/news`,
    ...dropOff.map((s) => `${BASE}/drop-off-charges/${s}`),
    ...avoid.map((s) => `${BASE}/avoid-drop-off-charge/${s}`),
    ...blueBadge.map((s) => `${BASE}/blue-badge/${s}`),
    ...parkingVsDropOff.map((s) => `${BASE}/parking-vs-drop-off/${s}`),
    ...parking.map((s) => `${BASE}/airport-parking/${s}`),
    ...parking.flatMap((s) => DURATIONS.map((d) => `${BASE}/airport-parking/${s}/${d}`)),
    ...lounges.map((s) => `${BASE}/airport-lounges/${s}`),
    ...news.map((id) => `${BASE}/news/${id}`)
  ])
].slice(0, 10000); // IndexNow caps at 10k URLs per request

if (DRY_RUN) {
  console.log(`IndexNow DRY RUN — ${urls.length} URLs:`);
  for (const u of urls) console.log(`  ${u}`);
  process.exit(0);
}

const body = JSON.stringify({
  host: new URL(BASE).hostname,
  key: KEY,
  keyLocation: `${BASE}/${KEY}.txt`,
  urlList: urls
});

const TIMEOUT_MS = 10_000;

async function submitOnce() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      signal: controller.signal
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

try {
  let res;
  try {
    res = await submitOnce();
  } catch (e) {
    // Network error or timeout — retry once
    console.warn(`IndexNow: transient error on first attempt, retrying — ${e.message}`);
    res = await submitOnce();
  }

  if (res.ok) {
    console.log(`IndexNow: ${res.status} ${res.statusText} — submitted ${urls.length} URLs to ${new URL(BASE).hostname}`);
  } else {
    // Do NOT retry on 4xx/5xx — log clearly so Vercel build logs surface the failure
    const errBody = await res.text().catch(() => "(could not read response body)");
    console.warn(
      `IndexNow: WARNING — submission rejected (non-fatal, build continues)\n` +
      `  status : ${res.status} ${res.statusText}\n` +
      `  body   : ${errBody.trim()}`
    );
  }
} catch (e) {
  console.warn(`IndexNow: submission failed after retry (non-fatal, build continues) — ${e.message}`);
}
process.exit(0);
