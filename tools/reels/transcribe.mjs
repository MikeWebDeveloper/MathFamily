// tools/reels/transcribe.mjs
// Word-level captions from a reel's voice track (local whisper.cpp, free).
// Usage: node transcribe.mjs <reelscript.json>  -> writes <base>.captions.json beside the wav.
import { installWhisperCpp, downloadWhisperModel, transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const WHISPER_DIR = join(here, ".whisper");        // gitignored cache (build + model)
const VERSION = "1.5.5";
const MODEL = process.env.REELS_WHISPER_MODEL || "base.en"; // clean TTS → base.en transcribes accurately + fast

const scriptPath = process.argv.slice(2).find((a) => a.endsWith(".json"));
if (!scriptPath) { console.error("usage: node transcribe.mjs <reelscript.json>"); process.exit(1); }
const reviewDir = dirname(scriptPath);
const base = basename(scriptPath, ".json");
const wav = join(reviewDir, base + ".wav");
if (!existsSync(wav)) { console.error(`no voice track: ${wav} (run synth first)`); process.exit(1); }

await installWhisperCpp({ to: WHISPER_DIR, version: VERSION });
await downloadWhisperModel({ model: MODEL, folder: WHISPER_DIR });

// whisper.cpp needs 16kHz mono WAV.
const wav16 = join(reviewDir, base + ".16k.wav");
execFileSync("ffmpeg", ["-y", "-i", wav, "-ar", "16000", "-ac", "1", wav16], { stdio: "ignore" });

const out = await transcribe({
  model: MODEL,
  whisperPath: WHISPER_DIR,
  whisperCppVersion: VERSION,
  inputPath: wav16,
  tokenLevelTimestamps: true,
  splitOnWord: true
});
const { captions } = toCaptions({ whisperCppOutput: out });
writeFileSync(join(reviewDir, base + ".captions.json"), JSON.stringify(captions));
console.log(`${base}.captions.json (${captions.length} tokens) written`);
