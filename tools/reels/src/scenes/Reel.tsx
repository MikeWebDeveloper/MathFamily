import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { ReelScript } from "../schema";
import { buildTimeline } from "../timeline";
import { THEME, MONO, SANS } from "./theme";

export type ReelProps = { script: ReelScript; audioDurationMs: number; audioSrc?: string };

const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

export const Reel: React.FC<ReelProps> = ({ script, audioDurationMs, audioSrc }) => {
  const { fps } = useVideoConfig();
  const theme = THEME[script.brand];
  const timed = buildTimeline(script.scenes, audioDurationMs);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: SANS }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      {timed.map((scene, i) => {
        const from = msToFrames(scene.startMs, fps);
        const dur = Math.max(1, msToFrames(scene.endMs - scene.startMs, fps));
        const isStat = scene.kind === "stat";
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 64, textAlign: "center" }}>
              <span style={{
                fontFamily: isStat ? MONO : SANS,
                fontSize: isStat ? 180 : 64,
                fontWeight: 700,
                color: scene.kind === "verified" ? theme.verified : theme.ink
              }}>
                {scene.onScreenText}
              </span>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
