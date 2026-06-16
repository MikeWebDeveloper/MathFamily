# tools/reels/tts/synth.py
# Usage: python synth.py <reelscript.json>  -> writes voice.wav + timing.json beside it.
# Engine via env REELS_TTS=kokoro|vibevoice|say (default kokoro). See tts/README.md for pinned versions.
import glob, json, os, sys, subprocess, wave, contextlib

def synth(engine: str, text: str, out_wav: str) -> None:
    if engine == "say":  # zero-dep macOS draft voice (timing only)
        aiff = out_wav.replace(".wav", ".aiff")
        subprocess.run(["say", "-o", aiff, text], check=True)
        subprocess.run(["afconvert", aiff, out_wav, "-d", "LEI16", "-f", "WAVE"], check=True)
        os.remove(aiff)
        return
    # kokoro / vibevoice via mlx-audio (local, Apple Silicon). Model + voice pinned in tts/README.md.
    from mlx_audio.tts.generate import generate_audio  # type: ignore
    model = os.environ.get("REELS_TTS_MODEL") or "prince-canuma/Kokoro-82M"
    voice = os.environ.get("REELS_TTS_VOICE") or "bf_emma"  # British female (Kokoro)
    lang = os.environ.get("REELS_TTS_LANG") or (voice[0] if voice else "a")  # 'b' = British English
    prefix = out_wav[:-4] if out_wav.endswith(".wav") else out_wav
    if os.path.exists(out_wav):  # remove any stale (e.g. `say`) wav so a model failure can't masquerade as success
        os.remove(out_wav)
    generate_audio(
        text=text, model=model, voice=voice, lang_code=lang,
        file_prefix=prefix, audio_format="wav", join_audio=True, play=False, verbose=False
    )
    if not os.path.exists(out_wav):  # mlx-audio may suffix segment files — normalise to out_wav
        produced = sorted(glob.glob(prefix + "*.wav"))
        if produced:
            os.replace(produced[0], out_wav)

def wav_duration_ms(path: str) -> int:
    with contextlib.closing(wave.open(path, "r")) as w:
        return round(w.getnframes() / float(w.getframerate()) * 1000)

def main() -> int:
    script_path = sys.argv[1]
    with open(script_path) as f:
        script = json.load(f)
    out_dir = os.path.dirname(os.path.abspath(script_path))
    out_wav = os.path.join(out_dir, "voice.wav")
    engine = os.environ.get("REELS_TTS", "kokoro")
    synth(engine, script["narration"], out_wav)
    timing = {"engine": engine, "audioDurationMs": wav_duration_ms(out_wav)}
    with open(os.path.join(out_dir, "timing.json"), "w") as f:
        json.dump(timing, f)
    print(f"voice.wav ({timing['audioDurationMs']}ms) + timing.json written to {out_dir}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
