import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { formatPence } from "@mathfamily/engine";
import type { ReelScript } from "../schema";
import { buildTimeline, type TimedScene } from "../timeline";
import { THEME, SANS, MONO, type BrandTheme } from "./theme";
import { BrandBackdrop, Wordmark, ProgressBar, Ticket, Stamp, Pill, Glyph } from "./graphics";

export type ReelProps = { script: ReelScript; audioDurationMs: number; audioSrc?: string };

const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
const BRAND_NAME: Record<ReelScript["brand"], string> = { parkmath: "ParkMath", roammath: "RoamMath" };
const center: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 90, textAlign: "center" };

function useEntrance(delay = 2) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 16 });
  return { opacity: p, transform: `translateY(${interpolate(p, [0, 1], [46, 0])}px)` };
}

/** Odometer-style count-up to a pence target, formatted as GBP. */
const Money: React.FC<{ pence: number; color: string; size?: number }> = ({ pence, color, size = 210 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const val = Math.max(0, Math.round(interpolate(p, [0, 1], [0, pence])));
  return <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>{formatPence(val)}</span>;
};

const SceneView: React.FC<{ scene: TimedScene; script: ReelScript; theme: BrandTheme }> = ({ scene, script, theme }) => {
  const enter = useEntrance();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fig = scene.figureIds.length ? script.figures.find((f) => f.id === scene.figureIds[0]) : undefined;

  if (scene.kind === "stat" && fig && fig.pence > 0) {
    return (
      <div style={{ ...center }}>
        <div style={enter}>
          <Ticket theme={theme}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, letterSpacing: 3, textTransform: "uppercase", color: theme.accent, marginBottom: 14 }}>{fig.label}</div>
              <Money pence={fig.pence} color={theme.bg} />
            </div>
          </Ticket>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 46, color: "#fff", marginTop: 48, ...enter }}>{scene.onScreenText}</div>
      </div>
    );
  }

  if (scene.kind === "stat") {
    return (
      <div style={{ ...center }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 128, color: "#fff", ...enter }}>{scene.onScreenText}</span>
      </div>
    );
  }

  if (scene.kind === "alternative") {
    const isFree = /free/i.test(scene.onScreenText);
    return (
      <div style={{ ...center, gap: 40 }}>
        <div style={enter}><Glyph name="tick" size={120} color={theme.good} /></div>
        {isFree ? <div style={enter}><Stamp theme={theme} label="Free" /></div> : null}
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 76, color: theme.good, lineHeight: 1.1, ...enter }}>{scene.onScreenText}</div>
      </div>
    );
  }

  if (scene.kind === "verified") {
    return (
      <div style={{ ...center }}>
        <div style={enter}>
          <Pill color={theme.good}><Glyph name="tick" size={34} color="#062b16" />{scene.onScreenText}</Pill>
        </div>
      </div>
    );
  }

  if (scene.kind === "cta") {
    const underline = interpolate(spring({ frame: frame - 6, fps, config: { damping: 200 } }), [0, 1], [0, 460]);
    return (
      <div style={{ ...center, gap: 40 }}>
        <div style={enter}><Wordmark theme={theme} name={BRAND_NAME[script.brand]} /></div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 56, color: "#fff", ...enter }}>{scene.onScreenText}</div>
        <div style={{ height: 10, width: underline, background: theme.accentBright, borderRadius: 6 }} />
      </div>
    );
  }

  // intro
  return (
    <div style={{ ...center, gap: 48 }}>
      <div style={enter}><Glyph name="plane" size={130} color={theme.accentBright} /></div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 72, color: "#fff", lineHeight: 1.15, ...enter }}>{scene.onScreenText}</div>
    </div>
  );
};

export const Reel: React.FC<ReelProps> = ({ script, audioDurationMs, audioSrc }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const theme = THEME[script.brand];
  const timed = buildTimeline(script.scenes, audioDurationMs);
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <BrandBackdrop theme={theme} />
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <div style={{ position: "absolute", top: 70, left: 70 }}><Wordmark theme={theme} name={BRAND_NAME[script.brand]} /></div>
      {timed.map((scene, i) => (
        <Sequence key={i} from={msToFrames(scene.startMs, fps)} durationInFrames={Math.max(1, msToFrames(scene.endMs - scene.startMs, fps))}>
          <SceneView scene={scene} script={script} theme={theme} />
        </Sequence>
      ))}
      <ProgressBar theme={theme} progress={frame / Math.max(1, durationInFrames)} />
    </AbsoluteFill>
  );
};
