// tools/reels/render.mjs
// Usage: node render.mjs review/<date>/<slug>.json
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = process.argv[2];
if (!scriptPath) { console.error("usage: node render.mjs <reelscript.json>"); process.exit(1); }

const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const reviewDir = dirname(scriptPath);
const timing = JSON.parse(readFileSync(join(reviewDir, "timing.json"), "utf8"));

const entry = join(here, "src", "index.ts");
const outDir = join(here, "out", basename(reviewDir));
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${script.brand}-${script.slug}.mp4`);

// staticDir = the review folder so <Audio src={staticFile("voice.wav")}/> resolves.
const serveUrl = await bundle({ entryPoint: entry, publicDir: reviewDir });
const inputProps = { script, audioDurationMs: timing.audioDurationMs, audioSrc: "voice.wav" };
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });

await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  outputLocation: outPath,
  inputProps
});
console.log(`rendered ${outPath}`);
