import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWatchlist } from "./watchlist";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "watchlist.json");
writeFileSync(out, JSON.stringify(buildWatchlist(), null, 2) + "\n");
console.log(`watchlist.json written: ${buildWatchlist().entries.length} entries`);
