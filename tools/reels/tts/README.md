# tools/reels/tts — local voice-over

`synth.py` reads a ReelScript JSON and writes `voice.wav` + `timing.json` beside it.

Engine via env `REELS_TTS`:
- `say` — macOS built-in, zero-dep, works today (draft/timing quality only).
- `vibevoice` (default) / `kokoro` — local, free, via Apple MLX (`mlx-audio`). **Not yet pinned.**

## Pending (Task 3 spike)
Before the AI voices work, the spike must pin and record here: the exact `pip install mlx-audio`
version, the chosen `REELS_TTS_MODEL` (a VibeVoice MLX port) + a British `REELS_TTS_VOICE`, and the
verified command that produced a wav. Until then, set `REELS_TTS=say` for a working draft voice:

    REELS_TTS=say python tools/reels/tts/synth.py review/<date>/<slug>.json
