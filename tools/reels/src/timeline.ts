import type { Scene } from "./schema";

export interface TimedScene extends Scene { startMs: number; endMs: number }

/** Distribute scenes across the real audio duration proportional to durationHintMs, contiguous,
 *  ending exactly at audioDurationMs (last scene absorbs rounding). */
export function buildTimeline(scenes: Scene[], audioDurationMs: number): TimedScene[] {
  const totalHint = scenes.reduce((n, s) => n + s.durationHintMs, 0);
  let cursor = 0;
  return scenes.map((s, i) => {
    const startMs = cursor;
    const span = i === scenes.length - 1 ? audioDurationMs - startMs : Math.round((s.durationHintMs / totalHint) * audioDurationMs);
    cursor = startMs + span;
    return { ...s, startMs, endMs: cursor };
  });
}
