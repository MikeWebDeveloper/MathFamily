#!/usr/bin/env node
/**
 * ParkMath affiliate-click counter (first-party, READ-ONLY, no deps).
 *
 * The /go redirect already emits one structured `parkmath_affiliate_click` line per click. That event
 * was logged but never counted — this tool turns the log stream into a durable, countable daily
 * clicks-by-airport-by-surface snapshot beside the other measurement snapshots.
 *
 * Usage:
 *   # From saved/piped runtime logs (works today, no credentials needed):
 *   vercel logs <deployment-url> | node tools/affiliate/clicks.mjs --stdin
 *   node tools/affiliate/clicks.mjs --file path/to/logs.txt
 *
 *   # Pull straight from the Vercel runtime-logs API (read-only) when a token is configured:
 *   node --env-file=tools/affiliate/.env tools/affiliate/clicks.mjs --pull
 *
 * Output: prints the aggregate and (unless --no-snapshot) writes tools/affiliate/snapshots/clicks-YYYY-MM-DD.json
 * Flags: --json (raw), --no-snapshot, --help
 *
 * The token (if used) is sent only as an Authorization header. This script issues GET requests only.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseClickEvents, aggregateClicks, buildVercelLogsUrl } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(HERE, "snapshots");

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? "prj_FOhagNfrcsDa1gm8Uip2A8GbEpUZ"; // math-family-parkmath
const TEAM_ID = process.env.VERCEL_TEAM_ID ?? "team_19SO92SSblB3MYeywToF6oB0";

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else { flags[key] = next; i += 1; }
    }
  }
  return flags;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function pullVercelLogs() {
  if (!TOKEN) die("VERCEL_TOKEN is not set. Copy tools/affiliate/.env.example → tools/affiliate/.env (or use --stdin / --file). The token is read-only here.");
  const url = buildVercelLogsUrl({ projectId: PROJECT_ID, teamId: TEAM_ID });
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
  if (res.status === 401 || res.status === 403) die(`${res.status} from Vercel — token invalid or lacks log-read scope.`);
  if (!res.ok) die(`Vercel logs API ${res.status} ${res.statusText}`);
  // The API returns newline-delimited JSON or a JSON array depending on plan; both flow through
  // parseClickEvents (it scans text for the marker), so just hand it the raw body text.
  return res.text();
}

function printAgg(agg) {
  console.log(`Affiliate clicks (parkmath_affiliate_click): ${agg.total}\n`);
  const section = (title, map) => {
    const entries = Object.entries(map);
    console.log(`${title}:`);
    if (entries.length === 0) console.log("  (none)");
    for (const [k, v] of entries) console.log(`  ${String(k).padEnd(28)} ${String(v).padStart(5)}`);
    console.log("");
  };
  section("By airport", agg.byAirport);
  section("By surface", agg.bySurface);
  section("By airport · surface", agg.byAirportSurface);
  section("By day (UTC)", agg.byDate);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    console.log("ParkMath affiliate-click counter. Sources: --stdin | --file <path> | --pull. Flags: --json, --no-snapshot.");
    return;
  }

  let text;
  if (flags.stdin) text = await readStdin();
  else if (typeof flags.file === "string") text = await readFile(flags.file, "utf8");
  else if (flags.pull) text = await pullVercelLogs();
  else die("Choose a source: --stdin, --file <path>, or --pull. (--help for usage.)");

  const events = parseClickEvents(text);
  const agg = aggregateClicks(events);

  if (flags.json) console.log(JSON.stringify(agg, null, 2));
  else printAgg(agg);

  if (!flags["no-snapshot"]) {
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const out = join(SNAPSHOT_DIR, `clicks-${day}.json`);
    await writeFile(out, JSON.stringify({ generatedAt: new Date().toISOString(), ...agg }, null, 2));
    if (!flags.json) console.log(`✓ Snapshot → ${out}`);
  }
}

main().catch((e) => die(e.message));
