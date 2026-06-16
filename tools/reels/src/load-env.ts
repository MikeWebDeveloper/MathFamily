import { existsSync, readFileSync } from "node:fs";

// Minimal .env loader (no dependency). Reads KEY=VALUE lines from `path` if it exists and sets
// process.env for keys not already present (shell environment always wins). Skips blank lines and
// # comments, and strips one layer of surrounding quotes. Returns the keys it set, for logging.
// Used by the digest CLI so analytics creds can live in a gitignored tools/reels/analytics.env
// instead of the shell history.
export function loadEnvFile(path: string): string[] {
  if (!existsSync(path)) return [];
  const set: string[] = [];
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = val;
      set.push(key);
    }
  }
  return set;
}
