import { Composition } from "remotion";
import { Reel, type ReelProps } from "./scenes/Reel";
import type { ReelScript } from "./schema";

const FPS = 30;
const placeholder: ReelScript = {
  version: "1", brand: "parkmath", format: "shock-fee", slug: "preview",
  figures: [{ id: "fee", label: "Fee", pence: 700 }],
  scenes: [
    { kind: "intro", onScreenText: "Preview", figureIds: [], durationHintMs: 1500 },
    { kind: "stat", onScreenText: "£7", figureIds: ["fee"], durationHintMs: 2500 },
    { kind: "cta", onScreenText: "parkmath.co.uk", figureIds: [], durationHintMs: 1500 }
  ],
  narration: "Preview. parkmath.co.uk.", captions: ["Preview"], cta: "parkmath.co.uk",
  sourceUrl: "https://example.com", verifiedAt: "2026-06-16"
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component={Reel as any}
    durationInFrames={FPS * 6}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{ script: placeholder, audioDurationMs: 6000, audioSrc: undefined } as ReelProps}
    calculateMetadata={({ props }) => {
      const p = props as unknown as ReelProps;
      return { durationInFrames: Math.max(1, Math.round((p.audioDurationMs / 1000) * FPS)) };
    }}
  />
);
