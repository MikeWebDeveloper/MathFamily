# tools/reels/tts — local voice-over

`synth.py` reads a ReelScript JSON and writes `voice.wav` + `timing.json` beside it.
All engines run **locally, free, no API key**. Engine via env `REELS_TTS`:

- `kokoro` (default) — Kokoro-82M via Apple MLX. Natural British voice, small + fast. **Verified working.**
- `say` — macOS built-in, zero-dep. Draft/timing quality only (robotic).
- `vibevoice` — heavier MLX model (see note below). Optional upgrade.

## Pinned setup (verified 2026-06-16, Apple Silicon)

mlx-audio needs **Python ≥3.10** — the system `python3` is 3.9 and fails on PEP-604 `X | Y`
type syntax inside `mlx_audio/dsp.py`. Use Homebrew's `python3.12`:

```bash
/opt/homebrew/bin/python3.12 -m venv ~/reels-venv312
~/reels-venv312/bin/pip install mlx-audio soundfile scipy sounddevice loguru "misaki[en]"
```

`soundfile`, `scipy`, `sounddevice`, `loguru`, and `misaki[en]` are import-time deps of mlx-audio's
Kokoro model that its wheel does **not** pull automatically. `misaki[en]` auto-downloads the spaCy
`en_core_web_sm` model on first run (for grapheme→phoneme). Model weights cache in
`~/.cache/huggingface` (shared, downloaded once).

- **Model:** `prince-canuma/Kokoro-82M` (mlx-audio default; override with `REELS_TTS_MODEL`).
- **Voice:** `bf_emma` — British female (override with `REELS_TTS_VOICE`). `lang_code` is inferred
  from the voice prefix (`b` = British, `a` = American), or set `REELS_TTS_LANG`.

### Verified command

```bash
REELS_TTS=kokoro ~/reels-venv312/bin/python tools/reels/tts/synth.py \
  "$(pwd)/tools/reels/review/<date>/<slug>.json"
```

Produces `voice.wav` (~16 s for a 5-scene shock-fee script) + `timing.json`
(`{"engine":"kokoro","audioDurationMs":...}`). `render.mjs` reads `audioDurationMs` to time the reel.

### Draft voice (no install)

```bash
REELS_TTS=say python3 tools/reels/tts/synth.py "$(pwd)/tools/reels/review/<date>/<slug>.json"
```

## VibeVoice (optional, heavier)

VibeVoice is multi-speaker/long-form and larger. To try it, set `REELS_TTS=vibevoice` and point
`REELS_TTS_MODEL` at a VibeVoice MLX port; it typically also wants a reference-audio clip
(`ref_audio`/`ref_text`). Kokoro `bf_emma` is the dependable default for short reels, so VibeVoice is
a quality experiment, not a requirement.
