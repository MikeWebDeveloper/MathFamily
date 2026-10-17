import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset, loadLoungeDataset, loadNewsDataset, loadParkingDataset, type DropOffRecord } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { qualifiesForAvoidPage } from "../lib/avoid-content";
import { blueBadgeStatusLabel } from "../lib/blue-badge-content";
import { parkingVsDropOffDecisionDescription, parkingVsDropOffDecisionTitle, parkingVsDropOffModel } from "../lib/parking-vs-drop-off-content";
import {
  HUB_META,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  abroadMeta,
  avoidDropOffMeta,
  blueBadgeMeta,
  clampToSentences,
  dropOffFeePhrase,
  dropOffMeta,
  fitDescription,
  fitTitle,
  latestDate,
  loungeMeta,
  newsMeta,
  optionsMeta,
  parkingDurationMeta,
  parkingMeta,
  renderedTitleLength,
  type PageMeta
} from "../lib/seo-meta";

const airports = loadAirports();
const nameOf = (slug: string) => airports.find((a) => a.slug === slug)!.name;
const dropOffs = loadDropOffDataset().records;
const parkings = loadParkingDataset().records;

/** Asserts the rendered SERP budgets, naming the page on failure so a long airport name is obvious. */
function expectFits(label: string, meta: PageMeta) {
  expect(renderedTitleLength(meta.title), `${label} title: "${meta.title}"`).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  expect(meta.description.length, `${label} description: "${meta.description}"`).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
}

describe("fit helpers", () => {
  it("fitTitle keeps the first candidate that fits with the layout suffix", () => {
    expect(fitTitle(["x".repeat(50), "short"])).toBe("short"); // 50 + " | ParkMath" = 61
    expect(fitTitle(["x".repeat(49), "short"])).toBe("x".repeat(49)); // exactly 60
  });
  it("fitTitle falls back to the shortest candidate when none fits", () => {
    expect(fitTitle(["x".repeat(80), "y".repeat(70)])).toBe("y".repeat(70));
  });
  it("fitDescription adds optional sentences in order only while they fit, skipping nulls", () => {
    expect(fitDescription("Lead.", [null, "Two.", "x".repeat(200), "Three."])).toBe("Lead. Two. Three.");
  });
  it("clampToSentences keeps whole sentences and does not split on a decimal price", () => {
    const text = `Bristol raised the fee to £8.50 from 5 January. ${"Long detail sentence. ".repeat(10)}`;
    const out = clampToSentences(text);
    expect(out.startsWith("Bristol raised the fee to £8.50 from 5 January.")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(out.endsWith(".")).toBe(true);
  });
  it("clampToSentences cuts a lone over-long sentence at a word boundary with an ellipsis", () => {
    const out = clampToSentences(`${"word ".repeat(60)}end.`);
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(out.endsWith("word…")).toBe(true);
  });
  it("latestDate picks the newest ISO date and ignores missing ones", () => {
    expect(latestDate("2026-08-13", null, "2026-10-07", undefined)).toBe("2026-10-07");
    expect(latestDate("2026-08-13")).toBe("2026-08-13");
  });
});

describe("dropOffFeePhrase", () => {
  const base = dropOffs[0]!;
  it("says per entry for a flat per-entry tariff, never 'for up to 1 min'", () => {
    const perEntry: DropOffRecord = { ...base, isFree: false, bands: [{ upToMinutes: 1, totalPence: 700 }] };
    expect(dropOffFeePhrase(perEntry)).toBe("£7 per entry");
  });
  it("quotes the first band with its time window", () => {
    const banded: DropOffRecord = { ...base, isFree: false, bands: [{ upToMinutes: 10, totalPence: 1000 }, { upToMinutes: 20, totalPence: 2000 }] };
    expect(dropOffFeePhrase(banded)).toBe("£10 for up to 10 min");
  });
  it("says free for a free airport", () => {
    expect(dropOffFeePhrase({ ...base, isFree: true, bands: [] })).toBe("free");
  });
});

describe("every generated airport page fits the SERP budget", () => {
  it("drop-off charges (generated template; dataset overrides pass through verbatim)", () => {
    for (const r of dropOffs) {
      const meta = dropOffMeta(nameOf(r.airportSlug), r);
      if (r.seoTitle) expect(meta.title).toBe(r.seoTitle);
      if (r.seoDescription) expect(meta.description).toBe(r.seoDescription);
      if (!r.seoTitle && !r.seoDescription) {
        expectFits(`drop-off/${r.airportSlug}`, meta);
        if (!r.isFree) expect(meta.description).toContain(formatPence(r.bands[0]!.totalPence));
      }
    }
  });
  it("avoid the drop-off charge", () => {
    for (const r of dropOffs.filter(qualifiesForAvoidPage)) {
      const meta = avoidDropOffMeta(nameOf(r.airportSlug), r);
      expectFits(`avoid/${r.airportSlug}`, meta);
      expect(meta.description).toContain(formatPence(r.bands[0]!.totalPence));
    }
  });
  it("blue badge", () => {
    for (const r of dropOffs.filter((x) => !x.blueBadgeSeoTitle && !x.blueBadgeSeoDescription)) {
      expectFits(`blue-badge/${r.airportSlug}`, blueBadgeMeta(nameOf(r.airportSlug), r, blueBadgeStatusLabel(r)));
    }
  });
  it("parking options", () => {
    for (const r of dropOffs.filter((x) => !x.optionsSeoTitle && !x.optionsSeoDescription)) {
      const parking = parkings.find((p) => p.airportSlug === r.airportSlug) ?? null;
      expectFits(`options/${r.airportSlug}`, optionsMeta(nameOf(r.airportSlug), r, parking));
    }
  });
  it("parking hub and every duration page, leading with the verified cheapest price", () => {
    for (const r of parkings) {
      expectFits(`parking/${r.airportSlug}`, parkingMeta(nameOf(r.airportSlug), r));
      for (const days of [3, 7, 14]) expectFits(`parking/${r.airportSlug}/${days}`, parkingDurationMeta(nameOf(r.airportSlug), r, days));
    }
  });
  it("lounges", () => {
    for (const r of loadLoungeDataset().records) expectFits(`lounges/${r.airportSlug}`, loungeMeta(nameOf(r.airportSlug), r));
  });
  it("going abroad", () => {
    for (const a of airports) expectFits(`abroad/${a.slug}`, abroadMeta(a.name));
  });
  it("parking vs drop-off", () => {
    for (const dropOff of dropOffs) {
      const parking = parkings.find((p) => p.airportSlug === dropOff.airportSlug);
      const model = parking ? parkingVsDropOffModel({ dropOff, parking }) : null;
      if (!model) continue;
      const name = nameOf(dropOff.airportSlug);
      expectFits(`parking-vs-drop-off/${dropOff.airportSlug}`, {
        title: parkingVsDropOffDecisionTitle(name),
        description: parkingVsDropOffDecisionDescription(model, name)
      });
    }
  });
  it("news descriptions fit, and titles no longer double the brand", () => {
    for (const item of loadNewsDataset().items) {
      const meta = newsMeta(item);
      expect(meta.description.length, item.id).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      expect(meta.title).not.toContain("ParkMath");
    }
  });
  it("hub pages", () => {
    for (const [key, meta] of Object.entries(HUB_META)) expectFits(`hub:${key}`, meta);
  });
});
