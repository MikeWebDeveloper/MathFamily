// tools/reels/still.mjs
// Export a single PNG frame of a reel (for slide covers / thumbnails).
// Usage: node still.mjs <reelscript.json> [frameNumber]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.RENDER_DIR || here;
const args = process.argv.slice(2).filter((a) => a !== "--");
const scriptPath = args.find((a) => a.endsWith(".json"));
if (!scriptPath) { console.error("usage: node still.mjs <reelscript.json> [frameNumber]"); process.exit(1); }
const frameArg = args.find((a) => /^\d+$/.test(a));

const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const reviewDir = dirname(scriptPath);
const base = basename(scriptPath, ".json");
const timing = JSON.parse(readFileSync(join(reviewDir, base + ".timing.json"), "utf8"));

const entry = join(root, "src", "index.ts");
const outDir = join(here, "out", basename(reviewDir));
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, base + ".png");

const serveUrl = await bundle({ entryPoint: entry, publicDir: reviewDir });
const inputProps = { script, audioDurationMs: timing.audioDurationMs, audioSrc: base + ".wav" };
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });
const frame = frameArg ? Number(frameArg) : Math.round(composition.durationInFrames * 0.45);

await renderStill({ serveUrl, composition, output: outPath, inputProps, frame });
console.log(`still ${outPath} @frame ${frame}`);
