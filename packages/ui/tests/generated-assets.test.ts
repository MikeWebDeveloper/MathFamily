import { describe, expect, it } from "vitest";
import { UK_PATH, UK_VIEWBOX, ukProject } from "../src/generated/uk-path";
import { WORLD_OUTLINE, COUNTRY_PATHS, COUNTRY_CENTROIDS, WORLD_VIEWBOX } from "../src/generated/world-paths";
import { FLAGS } from "../src/generated/flags";

describe("generated map assets", () => {
  it("has a non-trivial UK path and sane viewBox", () => {
    expect(UK_PATH.length).toBeGreaterThan(500);
    expect(UK_VIEWBOX).toMatch(/^0 0 200 \d+$/);
  });
  it("projects Heathrow inside the UK viewBox", () => {
    const parts = UK_VIEWBOX.split(" ").map(Number);
    const w = parts[2]!;
    const h = parts[3]!;
    const [x, y] = ukProject(51.47, -0.4543);
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(w);
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(h);
  });
  it("has world outline, 40 country paths and centroids", () => {
    expect(WORLD_OUTLINE.length).toBeGreaterThan(5000);
    expect(Object.keys(COUNTRY_PATHS)).toHaveLength(40);
    expect(Object.keys(COUNTRY_CENTROIDS)).toHaveLength(40);
    expect(WORLD_VIEWBOX).toMatch(/^0 0 1000 \d+$/);
  });
  it("has 41 flags (40 destinations + gb) with svg innards", () => {
    expect(Object.keys(FLAGS)).toHaveLength(41);
    expect(FLAGS.es).toContain("<");
    expect(FLAGS.es).not.toContain("<svg");
  });
});
