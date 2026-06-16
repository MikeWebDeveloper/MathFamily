// tools/reels/src/tts.mjs
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const SYNTH_PY = join(here, "..", "tts", "synth.py");

/** Build the argv for synthesising a ReelScript's audio. Pure — unit-tested. */
export function synthCommand(scriptJsonPath, python = process.env.REELS_PYTHON || "python3") {
  return [python, [SYNTH_PY, scriptJsonPath]];
}

export function synth(scriptJsonPath) {
  const [cmd, args] = synthCommand(scriptJsonPath);
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`TTS synth failed for ${scriptJsonPath}`);
}
