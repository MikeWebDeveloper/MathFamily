#!/usr/bin/env node
// ParkMath site + affiliate-deeplink watchdog — runner.
// Usage:
//   node tools/watchdog/check.mjs [--json] [--no-fetch] [--base https://parkmath.co.uk]
// Exit code: 0 = all green, 1 = one or more failures (or a fatal error).
// SAFETY: probes merchant DESTINATION pages only; never requests awin1.com/cread.php.
// On failure it writes docs/reports/watchdog-<date>.md (used by the watchdog skill for the issue body).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  DEFAULT_BASE_URL, recordsOf, enumerateRoutes, activePartners, expectedDeeplinks, destinationUrls, validateDeeplink, classifyResults, formatReport,
  DEFAULT_ROAMMATH_URL, analyticsTags, parseEnvFile, judgeAwinStatus, judgeUmamiLogin,
} from "./lib.mjs";
import { buildAccountsUrl } from "../awin/lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(REPO, "packages/data/datasets");
const UA = "Mozilla/5.0 (compatible; ParkMathWatchdog/1.0; +https://parkmath.co.uk)";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const noFetch = args.includes("--no-fetch");
const noPlumbing = args.includes("--no-plumbing");
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : DEFAULT_BASE_URL;
const roamIdx = args.indexOf("--roammath-base");
const ROAMMATH_BASE = roamIdx >= 0 ? args[roamIdx + 1] : DEFAULT_ROAMMATH_URL;

async function readJson(rel) { return JSON.parse(await readFile(path.join(DATA, rel), "utf8")); }

/** GET a URL once: ok if status 200 + real HTML body (pages) or any non-error (destinations). */
async function probe(url, { expectHtml }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA, accept: "text/html" } });
    if (expectHtml) {
      if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
      const body = await res.text();
      if (body.length < 500 || !body.toLowerCase().includes("</html>")) return { ok: false, detail: `thin/non-HTML body (${body.length}b)` };
      return { ok: true };
    }
    if (res.status >= 400) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, detail: e.name === "AbortError" ? `timeout >${TIMEOUT_MS}ms` : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

/** Probe once, retry a single time on failure (filters transient blips). */
async function probeRetry(url, opts) {
  const first = await probe(url, opts);
  if (first.ok) return first;
  return probe(url, opts);
}

/** One request with a timeout → { status, text } (status null on network error / timeout). Never throws. */
async function request(url, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, ...init, headers: { "user-agent": UA, ...(init.headers ?? {}) } });
    return { status: res.status, text: await res.text() };
  } catch {
    return { status: null, text: "" };
  } finally {
    clearTimeout(t);
  }
}

/** Read a repo-relative .env file, or null when it isn't on this machine (CI, fresh checkout). */
async function readEnv(rel) {
  try { return parseEnvFile(await readFile(path.join(REPO, rel), "utf8")); } catch { return null; }
}

/** Measurement-pipe checks (see lib.mjs PLUMBING_FIX). Read-only; secrets go only in headers/bodies to
 *  their own service and are never logged. AWIN is its *API* host, never the awin1.com click tracker. */
async function plumbingChecks() {
  const results = [];

  // ParkMath: both analytics tags present, and the Umami host the page loads from is answering.
  const pm = await request(BASE + "/", { headers: { accept: "text/html" } });
  if (pm.status !== 200) {
    results.push({ name: "cf-beacon-parkmath", ok: false, detail: `home page answered HTTP ${pm.status ?? "no response"}` });
    results.push({ name: "umami-host", ok: false, detail: `home page answered HTTP ${pm.status ?? "no response"}` });
  } else {
    const tags = analyticsTags(pm.text);
    results.push({ name: "cf-beacon-parkmath", ok: tags.cfBeacon, detail: tags.cfBeacon ? "beacon present" : "no beacon script in the home page HTML" });
    if (!tags.umamiScript) {
      results.push({ name: "umami-host", ok: false, detail: "no Umami script tag in the home page HTML" });
    } else {
      const u = await probeRetry(tags.umamiScript, { expectHtml: false });
      results.push({ name: "umami-host", ok: u.ok, detail: u.ok ? "Umami script loads" : `${new URL(tags.umamiScript).host} script → ${u.detail}` });
    }
  }

  // RoamMath: the Cloudflare beacon (its only analytics).
  const rm = await request(ROAMMATH_BASE + "/", { headers: { accept: "text/html" } });
  const rmBeacon = rm.status === 200 && analyticsTags(rm.text).cfBeacon;
  results.push({ name: "cf-beacon-roammath", ok: rmBeacon, detail: rm.status === 200 ? (rmBeacon ? "beacon present" : "no beacon script in the home page HTML") : `home page answered HTTP ${rm.status ?? "no response"}` });

  // AWIN API token (the weekly digest's only data source).
  const awinEnv = await readEnv("tools/awin/.env");
  if (!awinEnv?.AWIN_API_TOKEN) {
    results.push({ name: "awin-token", skipped: true, detail: "no AWIN_API_TOKEN in tools/awin/.env" });
  } else {
    const r = await request(buildAccountsUrl({ type: "publisher" }), { headers: { Authorization: `Bearer ${awinEnv.AWIN_API_TOKEN}`, accept: "application/json" } });
    results.push({ name: "awin-token", ...judgeAwinStatus(r.status) });
  }

  // Umami login (needed to read the affiliate_click counts at all).
  const um = await readEnv("tools/reels/analytics.env");
  if (!um?.UMAMI_HOST || !um.UMAMI_USER || !um.UMAMI_PASSWORD) {
    results.push({ name: "umami-auth", skipped: true, detail: "no Umami credentials in tools/reels/analytics.env" });
  } else {
    const r = await request(um.UMAMI_HOST.replace(/\/+$/, "") + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ username: um.UMAMI_USER, password: um.UMAMI_PASSWORD }),
    });
    results.push({ name: "umami-auth", ...judgeUmamiLogin(r.status) });
  }

  return results;
}

/** Run an async fn over items with a fixed concurrency cap. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

async function main() {
  const [airports, dropOff, parking, lounges, news, partnersJson] = await Promise.all([
    readJson("airports.json"), readJson("parkmath/drop-off-fees.json"), readJson("parkmath/parking-tariffs.json"),
    readJson("parkmath/lounges.json"), readJson("parkmath/news.json"),
    readFile(path.join(REPO, "apps/parkmath/lib/partners.json"), "utf8").then(JSON.parse),
  ]);

  // 1) Structural deeplink validation (no network).
  const airportSlugs = recordsOf(airports).map((a) => a.slug);
  const activeMids = new Set(activePartners(partnersJson).map((p) => p.awinmid));
  const publisherId = partnersJson.awin.publisherId;
  const deeplinkProblems = [];
  for (const l of expectedDeeplinks({ partnersJson, airportSlugs })) {
    const problems = validateDeeplink(l.url, { activeMids, publisherId, expectedUed: l.expectedUed });
    if (problems.length) deeplinkProblems.push({ url: l.url, problems });
  }

  // 2) Page liveness + 3) destination liveness (network, unless --no-fetch).
  let pageResults = [];
  let destResults = [];
  let plumbingResults = [];
  if (!noFetch) {
    const routes = enumerateRoutes({ airports, dropOff, parking, lounges, news });
    pageResults = await pool(routes, CONCURRENCY, async (r) => ({ path: r.path, ...(await probeRetry(BASE + r.path, { expectHtml: true })) }));
    const dests = destinationUrls(partnersJson);
    destResults = await pool(dests, CONCURRENCY, async (url) => ({ url, ...(await probeRetry(url, { expectHtml: false })) }));
    // 4) Measurement plumbing (analytics beacons, Umami, AWIN token), unless --no-plumbing.
    if (!noPlumbing) plumbingResults = await plumbingChecks();
  }

  const summary = classifyResults({ pageResults, destResults, deeplinkProblems, plumbingResults });

  // On failure, write the dated report (the watchdog skill uses it as the GitHub issue body).
  let reportPath = null;
  if (!summary.ok) {
    const date = new Date().toISOString().slice(0, 10);
    reportPath = path.join(REPO, "docs/reports", `watchdog-${date}.md`);
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, formatReport({ date, summary }));
  }

  if (asJson) {
    process.stdout.write(JSON.stringify({ base: BASE, reportPath, ...summary }, null, 2) + "\n");
  } else {
    console.log(`watchdog ${summary.ok ? "✅ all green" : "🔴 FAIL"} — ${summary.checked} checks, ${summary.failures.length} failing (base ${BASE})`);
    for (const f of summary.failures) console.log(`  - ${f.type} ${f.path || f.url || f.name}: ${f.detail}`);
    for (const s of summary.skipped) console.log(`  · skipped ${s.name}: ${s.detail}`);
    if (reportPath) console.log(`  report: ${reportPath}`);
  }
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => { console.error("watchdog fatal:", e); process.exit(1); });
