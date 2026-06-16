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
  DEFAULT_BASE_URL, recordsOf, enumerateRoutes, expectedDeeplinks, destinationUrls, validateDeeplink, classifyResults, formatReport,
} from "./lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(REPO, "packages/data/datasets");
const UA = "Mozilla/5.0 (compatible; ParkMathWatchdog/1.0; +https://parkmath.co.uk)";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const noFetch = args.includes("--no-fetch");
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : DEFAULT_BASE_URL;

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
  const activeMids = new Set(expectedDeeplinks({ partnersJson, airportSlugs: ["_"] }).map((l) => new URL(l.url).searchParams.get("awinmid")));
  const publisherId = partnersJson.awin.publisherId;
  const deeplinkProblems = [];
  for (const l of expectedDeeplinks({ partnersJson, airportSlugs })) {
    const problems = validateDeeplink(l.url, { activeMids, publisherId, expectedUed: l.expectedUed });
    if (problems.length) deeplinkProblems.push({ url: l.url, problems });
  }

  // 2) Page liveness + 3) destination liveness (network, unless --no-fetch).
  let pageResults = [];
  let destResults = [];
  if (!noFetch) {
    const routes = enumerateRoutes({ airports, dropOff, parking, lounges, news });
    pageResults = await pool(routes, CONCURRENCY, async (r) => ({ path: r.path, ...(await probeRetry(BASE + r.path, { expectHtml: true })) }));
    const dests = destinationUrls(partnersJson);
    destResults = await pool(dests, CONCURRENCY, async (url) => ({ url, ...(await probeRetry(url, { expectHtml: false })) }));
  }

  const summary = classifyResults({ pageResults, destResults, deeplinkProblems });

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
    for (const f of summary.failures) console.log(`  - ${f.type} ${f.path || f.url}: ${f.detail}`);
    if (reportPath) console.log(`  report: ${reportPath}`);
  }
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => { console.error("watchdog fatal:", e); process.exit(1); });
