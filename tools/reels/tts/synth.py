# tools/reels/tts/synth.py
# Usage: python synth.py <reelscript.json>  -> writes voice.wav + timing.json beside it.
# Engine via env REELS_TTS=vibevoice|kokoro|say (default vibevoice). See tts/README.md for pinned versions.
import json, os, sys, subprocess, wave, contextlib

def synth(engine: str, text: str, out_wav: str) -> None:
    if engine == "say":  # zero-dep macOS draft voice (timing only)
        aiff = out_wav.replace(".wav", ".aiff")
        subprocess.run(["say", "-o", aiff, text], check=True)
        subprocess.run(["afconvert", aiff, out_wav, "-d", "LEI16", "-f", "WAVE"], check=True)
        os.remove(aiff)
        return
    # vibevoice / kokoro via mlx-audio (exact model id/voice are pinned in tts/README.md)
    from mlx_audio.tts.generate import generate_audio  # type: ignore
    model = os.environ.get("REELS_TTS_MODEL", "")  # set per tts/README.md
    voice = os.environ.get("REELS_TTS_VOICE", "")
    generate_audio(text=text, model_path=model, voice=voice, file_path=out_wav)

def wav_duration_ms(path: str) -> int:
    with contextlib.closing(wave.open(path, "r")) as w:
        return round(w.getnframes() / float(w.getframerate()) * 1000)

def main() -> int:
    script_path = sys.argv[1]
    with open(script_path) as f:
        script = json.load(f)
    out_dir = os.path.dirname(os.path.abspath(script_path))
    out_wav = os.path.join(out_dir, "voice.wav")
    engine = os.environ.get("REELS_TTS", "vibevoice")
    synth(engine, script["narration"], out_wav)
    timing = {"engine": engine, "audioDurationMs": wav_duration_ms(out_wav)}
    with open(os.path.join(out_dir, "timing.json"), "w") as f:
        json.dump(timing, f)
    print(f"voice.wav ({timing['audioDurationMs']}ms) + timing.json written to {out_dir}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
