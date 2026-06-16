import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWeeklyBatch } from "./batch";
import { ReelScriptSchema } from "./schema";

const date = process.env.REELS_DATE; // injected by the skill/runner; fail loud if absent (no Date.now reliance)
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("set REELS_DATE=YYYY-MM-DD"); process.exit(1); }

const count = Number(process.env.REELS_COUNT ?? "5");
// Resolve relative to this file (tools/reels/src/cli.ts → up 2 = tools/reels/review/<date>)
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(pkgRoot, "review", date);
mkdirSync(dir, { recursive: true });

const scripts = buildWeeklyBatch(count);
for (const s of scripts) {
  ReelScriptSchema.parse(s); // belt-and-braces: never write an invalid/ungoverned script
  writeFileSync(join(dir, `${s.brand}-${s.slug}.json`), JSON.stringify(s, null, 2));
}
console.log(`wrote ${scripts.length} ReelScript(s) to ${dir}: ${scripts.map((s) => `${s.format}:${s.slug}`).join(", ")}`);
