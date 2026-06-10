import { describe, expect, it } from "vitest";
import { loadRoamingDataset } from "../src/index";

const EXPECTED = ["spain","france","italy","portugal","greece","germany","ireland","netherlands","belgium","austria","switzerland","poland","croatia","cyprus","malta","turkey","usa","canada","mexico","australia","new-zealand","uae","thailand","japan","china","india","south-africa","egypt","morocco","tunisia","norway","iceland","sweden","denmark","czechia","hungary","romania","bulgaria","albania","montenegro"].sort();

describe("roaming dataset coverage", () => {
  it("covers all 40 destinations exactly once", () => {
    const slugs = loadRoamingDataset().destinations.map((d) => d.countrySlug).sort();
    expect(slugs).toEqual(EXPECTED);
  });
  it("network sources are fresh", () => {
    for (const s of loadRoamingDataset().networkSources) {
      const age = (Date.now() - new Date(`${s.verifiedAt}T00:00:00Z`).getTime()) / 86_400_000;
      expect(age, `${s.network} source stale`).toBeLessThan(120);
    }
  });
});
