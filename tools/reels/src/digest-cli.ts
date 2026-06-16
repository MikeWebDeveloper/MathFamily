import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readLedger, recentEntries } from "./ledger";
import { buildDigest } from "./digest";
import { fetchReach } from "./analytics";
import { loadEnvFile } from "./load-env";

// Weekly loop digest: join the ledger (what we generated) to analytics reach, rank performers, write a
// review report + a recommendations.json the generator reads next run. Degrades to a "no analytics yet"
// report until PLAUSIBLE_* / CF_* creds are set.
const date = process.env.REELS_DATE;
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("set REELS_DATE=YYYY-MM-DD"); process.exit(1); }
const days = Number(process.env.DIGEST_DAYS ?? "7");

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(pkgRoot, "..", "..");
const ledgerPath = join(repoRoot, "tools", "social", "ledger.jsonl");
const reportDir = join(repoRoot, "docs", "reports");
const recoPath = join(repoRoot, "tools", "social", "recommendations.json");

// Load gitignored analytics creds (PLAUSIBLE_* / CF_*) from tools/reels/analytics.env if present.
// Shell env still wins, so CI/one-off overrides keep working.
loadEnvFile(join(pkgRoot, "analytics.env"));

const entries = recentEntries(readLedger(ledgerPath), days, date);
const { source, rows } = await fetchReach(days);
const d = buildDigest(entries, rows);

mkdirSync(reportDir, { recursive: true });
const report = [
  `# ParkMath reel loop digest — ${date}`,
  "",
  `Window: last ${days} days · analytics source: **${source}** · reels in window: ${entries.length} · total visitors: ${d.totalVisitors}`,
  "",
  "## Top performers",
  "",
  "| reel | campaign | visitors | outbound |",
  "|---|---|---|---|",
  ...d.performers.slice(0, 10).map((p) => `| ${p.format}:${p.slug} | ${p.campaign} | ${p.visitors} | ${p.outboundClicks} |`),
  "",
  "## Recommendation",
  "",
  d.recommendation,
  source === "none"
    ? "\n> No analytics source configured. Set `PLAUSIBLE_*` (preferred) or `CF_API_TOKEN`+`CF_ACCOUNT_TAG`+`CF_SITE_TAG` — see `tools/reels/analytics.env.example` — and re-run."
    : ""
].join("\n");
writeFileSync(join(reportDir, `loop-${date}.md`), report + "\n");

writeFileSync(
  recoPath,
  JSON.stringify({ generatedAt: date, source, boostFormats: d.boostFormats, boostSlugs: d.boostSlugs }, null, 2) + "\n"
);

console.log(`loop digest → docs/reports/loop-${date}.md (source: ${source}, ${entries.length} reels, ${d.totalVisitors} visitors)`);
console.log(`recommendations → tools/social/recommendations.json: formats=[${d.boostFormats.join(", ")}] slugs=[${d.boostSlugs.join(", ")}]`);
