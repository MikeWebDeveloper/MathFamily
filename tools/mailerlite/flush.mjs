#!/usr/bin/env node
/**
 * One-command import of captured ParkMath signups into MailerLite.
 *
 * Use this once the MailerLite token lands, to backfill every email captured during the
 * pre-token window (the durable fail-safe store: the Company signup inbox + Vercel runtime logs,
 * each `SIGNUP|<email>|<source>|<ts>` line). Idempotent — MailerLite upserts subscribers, so
 * re-running is safe.
 *
 * Token:  ~/.config/company/mailerlite-token   (NOT committed; env MAILERLITE_API_TOKEN overrides)
 * Group:  env MAILERLITE_GROUP_ID, or --group <id>, or resolved by --group-name (default "ParkMath")
 *
 * Usage:
 *   node tools/mailerlite/flush.mjs <emails-file>           # file: one email OR a SIGNUP| line per row
 *   node tools/mailerlite/flush.mjs --group 1234 list.txt
 *   node tools/mailerlite/flush.mjs --group-name ParkMath list.csv
 *   node tools/mailerlite/flush.mjs --dry-run list.txt      # parse + de-dupe only, no API calls
 *
 * Zero dependencies (Node >= 18 built-in fetch).
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "https://connect.mailerlite.com/api";

function die(msg) { console.error(`✗ ${msg}`); process.exit(1); }

function readToken() {
  if (process.env.MAILERLITE_API_TOKEN) return process.env.MAILERLITE_API_TOKEN.trim();
  const path = join(homedir(), ".config", "company", "mailerlite-token");
  try {
    const t = readFileSync(path, "utf8").trim();
    if (t) return t;
  } catch { /* fall through */ }
  die(`No MailerLite token. Put it at ~/.config/company/mailerlite-token or set MAILERLITE_API_TOKEN.`);
}

function parseArgs(argv) {
  const args = { dryRun: false, group: process.env.MAILERLITE_GROUP_ID || null, groupName: "ParkMath", file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--group") args.group = argv[++i];
    else if (a === "--group-name") args.groupName = argv[++i];
    else if (!a.startsWith("--")) args.file = a;
  }
  if (!args.file) die("Pass an emails file: node tools/mailerlite/flush.mjs <emails-file>");
  return args;
}

const EMAIL_RE = /[^\s|,;<>]+@[^\s|,;<>]+\.[^\s|,;<>]+/;

/** Extract one email per line. Accepts plain emails, CSV rows, and raw `SIGNUP|email|...` log lines. */
function extractEmails(text) {
  const out = new Set();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(EMAIL_RE);
    if (m) out.add(m[0].toLowerCase());
  }
  return [...out];
}

async function ml(token, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {})
    }
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function resolveGroupId(token, { group, groupName }) {
  if (group) return String(group);
  // Find an existing group by name, else create it.
  const list = await ml(token, `/groups?filter[name]=${encodeURIComponent(groupName)}&limit=50`);
  if (list.ok) {
    const hit = (list.json.data || []).find((g) => g.name === groupName);
    if (hit) return hit.id;
  }
  const created = await ml(token, `/groups`, { method: "POST", body: JSON.stringify({ name: groupName }) });
  if (created.ok && created.json.data?.id) {
    console.log(`• created MailerLite group "${groupName}" (id ${created.json.data.id})`);
    return created.json.data.id;
  }
  die(`Could not resolve or create group "${groupName}" (status ${created.status}). Pass --group <id>.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const text = readFileSync(args.file, "utf8");
  const emails = extractEmails(text);
  if (emails.length === 0) die(`No emails found in ${args.file}.`);
  console.log(`Found ${emails.length} unique email(s) in ${args.file}.`);

  if (args.dryRun) {
    emails.forEach((e) => console.log(`  would import: ${e}`));
    console.log(`\n(dry run — no API calls made)`);
    return;
  }

  const token = readToken();
  const groupId = await resolveGroupId(token, args);
  console.log(`Importing into group ${groupId}…\n`);

  let ok = 0, fail = 0;
  for (const email of emails) {
    const r = await ml(token, `/subscribers`, { method: "POST", body: JSON.stringify({ email, groups: [groupId] }) });
    if (r.ok) { ok++; console.log(`  ✓ ${email}`); }
    else { fail++; console.log(`  ✗ ${email} (status ${r.status}: ${r.json?.message || ""})`); }
  }
  console.log(`\nDone. ${ok} imported, ${fail} failed, ${emails.length} total.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => die(e.message));
