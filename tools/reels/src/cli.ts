import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWeeklyBatch } from "./batch";
import { ReelScriptSchema } from "./schema";
import { readLedger, recentSlugs, ledgerEntryFor, appendEntries } from "./ledger";

const date = process.env.REELS_DATE; // injected by the skill/runner; fail loud if absent (no Date.now reliance)
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("set REELS_DATE=YYYY-MM-DD"); process.exit(1); }

const count = Number(process.env.REELS_COUNT ?? "5");
const dedupeDays = Number(process.env.REELS_DEDUPE_DAYS ?? "14");

// Resolve relative to this file: tools/reels/src/cli.ts → tools/reels (pkg) → repo root.
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(pkgRoot, "..", "..");
const ledgerPath = join(repoRoot, "tools", "social", "ledger.jsonl");
const dir = join(pkgRoot, "review", date);
mkdirSync(dir, { recursive: true });

// Cross-run dedupe: don't re-pick airports covered in the last `dedupeDays` days.
const recent = recentSlugs(readLedger(ledgerPath), dedupeDays, date);
const scripts = buildWeeklyBatch(count, recent);
for (const s of scripts) {
  ReelScriptSchema.parse(s); // belt-and-braces: never write an invalid/ungoverned script
  writeFileSync(join(dir, `${s.brand}-${s.slug}.json`), JSON.stringify(s, null, 2));
}

// Record each reel in the ledger with its first-party UTM landing URL (the join key for attribution).
const entries = scripts.map((s) => ledgerEntryFor(s, date));
appendEntries(ledgerPath, entries);

console.log(`wrote ${scripts.length} ReelScript(s) to ${dir}: ${scripts.map((s) => `${s.format}:${s.slug}`).join(", ")}`);
console.log(`ledger += ${entries.length} entries (${ledgerPath}); skipped ${recent.size} recently-used slug(s)`);
for (const e of entries) console.log(`  ${e.id}  →  ${e.landingUrl}`);
