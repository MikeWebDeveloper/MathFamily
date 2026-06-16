// tools/reels/render.mjs
// Render a reel to a crisp, platform-ready MP4: Remotion render (h264/yuv420p/bt709) then an
// ffmpeg post-pass that loudness-normalises to -14 LUFS and (optionally) ducks a music bed.
// Usage: node render.mjs <reelscript.json>
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync, existsSync, rmSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.RENDER_DIR || here;
const scriptPath = process.argv.slice(2).find((a) => a !== "--");
if (!scriptPath) { console.error("usage: node render.mjs <reelscript.json>"); process.exit(1); }

const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const reviewDir = dirname(scriptPath);
const base = basename(scriptPath, ".json");
const timing = JSON.parse(readFileSync(join(reviewDir, base + ".timing.json"), "utf8"));
const capPath = join(reviewDir, base + ".captions.json");
const captions = existsSync(capPath) ? JSON.parse(readFileSync(capPath, "utf8")) : [];

const entry = join(root, "src", "index.ts");
const outDir = join(here, "out", basename(reviewDir));
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${script.brand}-${script.slug}.mp4`);
const rawPath = join(outDir, `${script.brand}-${script.slug}.raw.mp4`);

// staticDir = the review folder so <Audio src={staticFile("voice.wav")}/> resolves.
const serveUrl = await bundle({ entryPoint: entry, publicDir: reviewDir });
const inputProps = { script, audioDurationMs: timing.audioDurationMs, audioSrc: base + ".wav", captions };
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });

await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  crf: 18,
  pixelFormat: "yuv420p",   // platforms re-encode (and soften) anything else
  colorSpace: "bt709",      // avoid colour shift on upload
  audioCodec: "aac",
  audioBitrate: "192k",
  outputLocation: rawPath,
  inputProps
});

// Post-pass: loudness-normalise (and optionally duck a music bed under the VO). Video copied, not re-encoded.
const lufs = process.env.REELS_LUFS || "-14"; // -12 for a louder TikTok master
const music = process.env.REELS_MUSIC && existsSync(process.env.REELS_MUSIC) ? process.env.REELS_MUSIC : null;
const loud = `loudnorm=I=${lufs}:TP=-1.5:LRA=11`;
try {
  if (music) {
    const fc =
      `[0:a]asplit=2[vo][sc];` +
      `[1:a][sc]sidechaincompress=threshold=0.02:ratio=8:attack=50:release=400[duck];` +
      `[vo][duck]amix=inputs=2:weights=1 0.18:duration=first[mix];` +
      `[mix]${loud}[out]`;
    execFileSync("ffmpeg", ["-y", "-i", rawPath, "-i", music, "-filter_complex", fc, "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", outPath], { stdio: "inherit" });
  } else {
    execFileSync("ffmpeg", ["-y", "-i", rawPath, "-af", loud, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", outPath], { stdio: "inherit" });
  }
  rmSync(rawPath, { force: true });
  console.log(`rendered ${outPath} (loudnorm ${lufs} LUFS${music ? " + music bed" : ""})`);
} catch (e) {
  renameSync(rawPath, outPath); // ffmpeg unavailable/failed — keep the un-normalised render
  console.warn(`rendered ${outPath} (ffmpeg post-pass skipped: ${e.message})`);
}
