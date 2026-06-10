import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contentFingerprint } from "./normalize";
import type { Watchlist, WatchEntry } from "./watchlist";

export type Fetcher = (url: string) => Promise<Buffer>;

export interface HashRecord {
  hash: string;
  checkedAt: string;
  pendingSince?: string;
}
export type HashState = Record<string, HashRecord>;

export interface WatchdogResult {
  changed: { url: string; refs: string[] }[];
  errors: { url: string; message: string }[];
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export const defaultFetcher: Fetcher = async (url) => {
  const attempts = [url, `https://r.jina.ai/${url}`];
  let lastError: unknown;
  for (const target of attempts) {
    try {
      const res = await fetch(target, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/pdf" }, signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const text = buf.subarray(0, 400).toString("utf8").toLowerCase();
      if (text.includes("you have been blocked") || text.includes("security verification") || text.includes("verifying you are")) {
        throw new Error("block page");
      }
      return buf;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

export async function runWatchdog(list: Watchlist, state: HashState, fetcher: Fetcher, now: Date): Promise<WatchdogResult> {
  const today = now.toISOString().slice(0, 10);
  const result: WatchdogResult = { changed: [], errors: [] };

  for (const entry of list.entries.filter((e: WatchEntry) => e.watchable)) {
    let hash: string;
    try {
      hash = contentFingerprint(await fetcher(entry.url));
    } catch (error) {
      result.errors.push({ url: entry.url, message: error instanceof Error ? error.message : String(error) });
      continue;
    }
    const stored = state[entry.url];
    if (!stored) {
      state[entry.url] = { hash, checkedAt: today }; // bootstrap: seed silently
    } else if (stored.hash === hash) {
      stored.checkedAt = today;
      delete stored.pendingSince; // page returned to known state
    } else if (!stored.pendingSince) {
      stored.pendingSince = today;
      stored.checkedAt = today;
      result.changed.push({ url: entry.url, refs: entry.refs });
    } else {
      stored.checkedAt = today; // already pending: single-trigger rule
    }
  }
  return result;
}

// CLI: reads watchlist.json + hashes.json, runs, persists state, prints JSON result.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const list = JSON.parse(readFileSync(join(root, "watchlist.json"), "utf8")) as Watchlist;
  const state = JSON.parse(readFileSync(join(root, "hashes.json"), "utf8")) as HashState;
  runWatchdog(list, state, defaultFetcher, new Date()).then((result) => {
    writeFileSync(join(root, "hashes.json"), JSON.stringify(state, null, 2) + "\n");
    console.log(JSON.stringify(result));
    process.exit(0);
  });
}
