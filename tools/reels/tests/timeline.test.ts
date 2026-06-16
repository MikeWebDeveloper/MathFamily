import { describe, it, expect } from "vitest";
import { buildTimeline } from "../src/timeline";
import type { Scene } from "../src/schema";

const scenes: Scene[] = [
  { kind: "intro", onScreenText: "a", figureIds: [], durationHintMs: 1000 },
  { kind: "stat", onScreenText: "b", figureIds: [], durationHintMs: 3000 }
];

describe("buildTimeline", () => {
  it("scales scene hints to fill the real audio duration and is contiguous", () => {
    const timed = buildTimeline(scenes, 8000);
    expect(timed[0].startMs).toBe(0);
    expect(timed[1].startMs).toBe(timed[0].endMs);
    expect(timed[timed.length - 1].endMs).toBe(8000);
    expect(timed[1].endMs - timed[1].startMs).toBeGreaterThan(timed[0].endMs - timed[0].startMs);
  });
});
