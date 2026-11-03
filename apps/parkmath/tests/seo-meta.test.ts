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
  parkingHubHeading,
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
  it("news titles and descriptions fit, and titles no longer double the brand", () => {
    for (const item of loadNewsDataset().items) {
      const meta = newsMeta(item);
      expectFits(`news/${item.id}`, meta);
      expect(meta.title).not.toContain("ParkMath");
    }
  });
  it("dataset SEO overrides fit too, and carry no hard-coded verified date (it would go stale)", () => {
    const pairs = [
      ["seoTitle", "seoDescription"],
      ["blueBadgeSeoTitle", "blueBadgeSeoDescription"],
      ["optionsSeoTitle", "optionsSeoDescription"]
    ] as const;
    for (const r of dropOffs) {
      for (const [t, d] of pairs) {
        const title = r[t];
        const description = r[d];
        if (title) expect(renderedTitleLength(title), `${r.airportSlug}.${t}: "${title}"`).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
        if (description) expect(description.length, `${r.airportSlug}.${d}: "${description}"`).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
        for (const s of [title, description]) if (s) expect(s, `${r.airportSlug}: "${s}"`).not.toMatch(/20\d\d-\d\d-\d\d|[Vv]erified 20\d\d/);
      }
    }
  });
  it("hub pages", () => {
    for (const [key, meta] of Object.entries(HUB_META)) expectFits(`hub:${key}`, meta);
  });
});

describe("parking hub title/meta/H1 only promise what the page shows (2026-11-02 audit)", () => {
  // The hub page lists the dataset's products. "Pre-book" may appear in the SERP snippet only for
  // airports whose record actually carries a dated pre-book product; every other airport shows drive-up
  // gate prices alone (merchant cards below them carry no prices), so a "gate vs pre-book" promise
  // was a title/content mismatch.
  const hasPrebook = (r: (typeof parkings)[number]) => r.products.some((p) => p.productType === "prebook");
  const gateOnly = parkings.filter((r) => !hasPrebook(r));
  const withPrebook = parkings.filter(hasPrebook);

  it("the dataset has both kinds, so this guard is exercising something real", () => {
    expect(gateOnly.length).toBeGreaterThan(0);
    expect(withPrebook.length).toBeGreaterThan(0);
  });

  it("gate-only airports: title, description and H1 never say pre-book, and still fit the SERP budget", () => {
    for (const r of gateOnly) {
      const name = nameOf(r.airportSlug);
      const meta = parkingMeta(name, r);
      expectFits(`parking/${r.airportSlug}`, meta);
      expect(meta.title, `title for ${r.airportSlug}`).not.toMatch(/pre-?book/i);
      expect(meta.description, `description for ${r.airportSlug}`).not.toMatch(/pre-?book/i);
      expect(parkingHubHeading(name, r), `H1 for ${r.airportSlug}`).not.toMatch(/pre-?book/i);
    }
  });

  it("airports with a pre-book product keep the 'gate vs pre-book' framing, because the page does show both", () => {
    for (const r of withPrebook) {
      const name = nameOf(r.airportSlug);
      expect(parkingMeta(name, r).title).toMatch(/gate vs pre-book/);
      expect(parkingHubHeading(name, r)).toMatch(/gate vs pre-book/);
    }
  });

  it("heathrow: same keyword intent (parking prices 2026), truthful, and ≤60 rendered", () => {
    const r = parkings.find((x) => x.airportSlug === "heathrow")!;
    const meta = parkingMeta(nameOf("heathrow"), r);
    expect(meta.title).toContain("Heathrow");
    expect(meta.title).toContain("parking prices 2026");
    expect(meta.title).toMatch(/gate/i);
    expect(meta.title).not.toMatch(/pre-?book/i);
    expect(renderedTitleLength(meta.title)).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(meta.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    // The 7-day gate figure is the one thing the description leads with, and it is not called "cheapest".
    expect(meta.description).toContain("£271.20");
    expect(meta.description).not.toMatch(/cheapest/i);
  });
});
