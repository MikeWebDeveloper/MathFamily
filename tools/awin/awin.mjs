#!/usr/bin/env node
/**
 * First-party, READ-ONLY Awin client for ParkMath. No third-party code, no deps.
 *
 *   node --env-file=tools/awin/.env tools/awin/awin.mjs <command> [flags]
 *
 * Commands:
 *   accounts                              List publisher accounts (find your AWIN_PUBLISHER_ID)
 *   programmes [--status <rel>]           Merchant join-status (joined|pending|suspended|rejected|notjoined)
 *   programmes --watch                    Diff joined+pending vs the last snapshot; report Pending→Joined flips
 *   transactions --since <YYYY-MM-DD> [--until <YYYY-MM-DD>] [--status <s>]
 *                                         Earnings, aggregated by airport (clickRef) and advertiser
 *   feed list                             List available product feeds (needs AWIN_FEED_API_KEY)
 *   feed download --url "<create-a-feed url>" [--out file]   Download a product feed
 *
 * Global flags: --json (raw JSON output), --help
 *
 * The OAuth token is sent only as an `Authorization: Bearer` header — never in a URL
 * or log line. This script issues GET requests only; it never modifies your account.
 */
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildAccountsUrl,
  buildProgrammesUrl,
  buildTransactionsUrl,
  buildFeedListUrl,
  toAwinStart,
  toAwinEnd,
  validateRange,
  chunkRange,
  aggregateTransactions,
  diffProgrammes,
  parseFeedListCsv,
} from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(HERE, ".awin-programmes.json");
const RATE_GAP_MS = 3500; // ≥ 20 calls/min headroom when chunking

const TOKEN = process.env.AWIN_API_TOKEN;
const PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID;
const FEED_KEY = process.env.AWIN_FEED_API_KEY;

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

async function awinGet(url) {
  if (!TOKEN) die("AWIN_API_TOKEN is not set. Copy tools/awin/.env.example → tools/awin/.env and add your token (from https://ui.awin.com/awin-api).");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  });
  if (res.status === 401) die("401 Unauthorized — token invalid or expired. Regenerate it at https://ui.awin.com/awin-api.");
  if (res.status === 429) die("429 Too Many Requests — Awin limits to 20 calls/minute. Wait a minute and retry.");
  if (!res.ok) die(`Awin API ${res.status} ${res.statusText} for ${url.replace(/\/\/.*@/, "//")}`);
  return res.json();
}

function requirePublisher() {
  if (!PUBLISHER_ID) die("AWIN_PUBLISHER_ID is not set. Run `awin accounts` to find it, then add it to tools/awin/.env.");
  return PUBLISHER_ID;
}

// ---- commands --------------------------------------------------------------

async function cmdAccounts(flags) {
  const data = await awinGet(buildAccountsUrl({ type: "publisher" }));
  if (flags.json) return console.log(JSON.stringify(data, null, 2));
  const accounts = data.accounts ?? data;
  console.log("Publisher accounts:");
  for (const a of accounts) console.log(`  ${a.accountId}\t${a.accountName}\t(${a.userRole ?? "?"})`);
  console.log("\nSet AWIN_PUBLISHER_ID to the accountId you want in tools/awin/.env.");
}

async function fetchProgrammeMap(relationships) {
  const pub = requirePublisher();
  const map = {};
  for (const rel of relationships) {
    const list = await awinGet(buildProgrammesUrl(pub, { relationship: rel }));
    for (const p of list) map[String(p.id)] = { name: p.name, relationship: rel };
  }
  return map;
}

async function cmdProgrammes(flags) {
  if (flags.watch) {
    const curr = await fetchProgrammeMap(["joined", "pending"]);
    let prev = {};
    try { prev = JSON.parse(await readFile(SNAPSHOT, "utf8")); } catch { /* first run */ }
    const changes = diffProgrammes(prev, curr);
    await writeFile(SNAPSHOT, JSON.stringify(curr, null, 2));
    if (flags.json) return console.log(JSON.stringify({ changes, snapshot: curr }, null, 2));
    if (changes.length === 0) { console.log("No relationship changes since last snapshot."); return; }
    console.log("Relationship changes:");
    for (const c of changes) {
      const mark = c.to === "joined" ? "✅" : c.to === "pending" ? "⏳" : "•";
      console.log(`  ${mark} ${c.name} (${c.id}): ${c.from} → ${c.to}`);
    }
    return;
  }
  const pub = requirePublisher();
  const rel = flags.status || undefined;
  const list = await awinGet(buildProgrammesUrl(pub, rel ? { relationship: rel } : {}));
  if (flags.json) return console.log(JSON.stringify(list, null, 2));
  console.log(`Programmes${rel ? ` (relationship=${rel})` : ""}: ${list.length}`);
  for (const p of list) console.log(`  ${String(p.id).padEnd(8)} ${p.name}`);
}

async function cmdTransactions(flags) {
  const pub = requirePublisher();
  const since = flags.since;
  const until = flags.until || since;
  if (!since) die("transactions needs --since <YYYY-MM-DD> [--until <YYYY-MM-DD>]");
  validateRangeFriendly(since, until);

  const chunks = chunkRange(since, until);
  const all = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const { start, end } = chunks[i];
    const url = buildTransactionsUrl(pub, {
      startDate: toAwinStart(start),
      endDate: toAwinEnd(end),
      timezone: "Europe/London",
      dateType: "transaction",
      ...(flags.status ? { status: flags.status } : {}),
    });
    const batch = await awinGet(url);
    if (Array.isArray(batch)) all.push(...batch);
    if (i < chunks.length - 1) await sleep(RATE_GAP_MS);
  }

  if (flags.json) return console.log(JSON.stringify(all, null, 2));
  const agg = aggregateTransactions(all);
  const { totals } = agg;
  console.log(`Transactions ${since} → ${until}: ${totals.count}`);
  console.log(`  Commission: ${totals.commission} ${totals.currency}   Sales: ${totals.sale} ${totals.currency}\n`);
  printSection("By airport", agg.byAirport, totals.currency);
  printSection("By advertiser", agg.byAdvertiser, totals.currency);
}

async function cmdFeed(sub, flags) {
  if (sub === "list") {
    if (!FEED_KEY) die("AWIN_FEED_API_KEY is not set. Get the product-feed key from Awin → Toolbox → Create-a-Feed, add it to tools/awin/.env.");
    const res = await fetch(buildFeedListUrl(FEED_KEY));
    if (!res.ok) die(`Feed list ${res.status} ${res.statusText}`);
    const rows = parseFeedListCsv(await res.text());
    if (flags.json) return console.log(JSON.stringify(rows, null, 2));
    console.log(`Feeds: ${rows.length}`);
    for (const r of rows.slice(0, 200)) {
      console.log(`  ${(r["Feed ID"] ?? "").padEnd(8)} ${(r["Advertiser ID"] ?? "").padEnd(8)} ${r["Advertiser Name"] ?? ""}`);
    }
    return;
  }
  if (sub === "download") {
    if (!flags.url || flags.url === true) die('feed download needs --url "<create-a-feed download URL>" (copy it from Awin → Create-a-Feed).');
    const out = typeof flags.out === "string" ? flags.out : "awin-feed.csv";
    const res = await fetch(flags.url);
    if (!res.ok) die(`Feed download ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(out, buf);
    console.log(`✓ Saved ${buf.length} bytes → ${out}`);
    return;
  }
  die("feed subcommand must be `list` or `download`");
}

// ---- helpers ---------------------------------------------------------------

function validateRangeFriendly(since, until) {
  try { validateRange(since, until); } catch (e) { die(e.message); }
}
function printSection(title, map, currency) {
  const entries = Object.entries(map).sort((a, b) => b[1].commission - a[1].commission);
  console.log(`${title}:`);
  for (const [key, v] of entries) {
    console.log(`  ${key.padEnd(16)} ${String(v.commission).padStart(8)} ${currency}  (${v.count})`);
  }
  console.log("");
}

const HELP = `Awin client (read-only). Run with: node --env-file=tools/awin/.env tools/awin/awin.mjs <command>

  accounts                                   list publisher accounts → find AWIN_PUBLISHER_ID
  programmes [--status joined|pending|...]   merchant join-status
  programmes --watch                         report relationship flips vs last snapshot
  transactions --since DATE [--until DATE]   earnings by airport + advertiser (DATE = YYYY-MM-DD)
  feed list                                  list product feeds (needs AWIN_FEED_API_KEY)
  feed download --url "<url>" [--out FILE]   download a Create-a-Feed export

Global: --json, --help`;

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const flags = parseFlags(rest);
  if (!cmd || cmd === "--help" || flags.help) { console.log(HELP); return; }
  switch (cmd) {
    case "accounts": return cmdAccounts(flags);
    case "programmes": return cmdProgrammes(flags);
    case "transactions": return cmdTransactions(flags);
    case "feed": return cmdFeed(rest[0], flags);
    default: die(`Unknown command "${cmd}". Run --help.`);
  }
}

main().catch((e) => die(e.message));
