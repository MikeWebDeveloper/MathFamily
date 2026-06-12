import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface NewsSource { airportSlug: string; url: string; label: string }
export interface NewsSourcesFile { generatedAt: string; sources: NewsSource[] }

export function loadNewsSources(): NewsSourcesFile {
  const p = join(dirname(fileURLToPath(import.meta.url)), "..", "news-sources.json");
  return JSON.parse(readFileSync(p, "utf8")) as NewsSourcesFile;
}
