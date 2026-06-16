import { useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { SANS } from "./theme";
import { SAFE } from "./safe";

export type { Caption };

// Karaoke-style captions for silent autoplay: the active word highlights. Sits in the bottom safe band.
export const Captions: React.FC<{ captions: Caption[]; highlight: string }> = ({ captions, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const { pages } = createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1200 });
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.LEFT,
        right: SAFE.RIGHT,
        bottom: SAFE.BOTTOM,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 60,
        lineHeight: 1.2,
        color: "#fff",
        textShadow: "0 2px 14px rgba(0,0,0,0.6)"
      }}
    >
      {page.tokens.map((t, i) => {
        const active = ms >= t.fromMs && ms < t.toMs;
        return (
          <span key={i} style={{ color: active ? highlight : "#fff" }}>
            {t.text}
          </span>
        );
      })}
    </div>
  );
};
