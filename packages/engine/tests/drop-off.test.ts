import { describe, expect, it } from "vitest";
import { quoteDropOff, type DropOffTariff } from "../src/drop-off";

const NOW = new Date("2026-06-10T12:00:00Z");

const gatwickLike: DropOffTariff = {
  isFree: false,
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: 10000,
  freeAlternative: { name: "Long Stay car park", minutesFree: 30 },
  verifiedAt: "2026-06-01"
};

const stanstedLike: DropOffTariff = {
  isFree: false,
  bands: [
    { upToMinutes: 15, totalPence: 1000 },
    { upToMinutes: 60, totalPence: 2800 }
  ],
  maxStayMinutes: 60,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: null,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

const freeAirport: DropOffTariff = {
  isFree: true,
  bands: [],
  maxStayMinutes: null,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: null,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

// Per-minute continuation fixtures (Fix 1): published rate continues after the last band.
const gatwickPerMinute: DropOffTariff = {
  isFree: false,
  bands: [{ upToMinutes: 10, totalPence: 1000 }],
  maxStayMinutes: 30,
  perMinuteAfterPence: 100,
  maxChargePence: 3000,
  penaltyPence: 10000,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

const londonCityPerMinute: DropOffTariff = {
  isFree: false,
  bands: [{ upToMinutes: 5, totalPence: 800 }],
  maxStayMinutes: 10,
  perMinuteAfterPence: 100,
  maxChargePence: null,
  penaltyPence: null,
  freeAlternative: null,
  verifiedAt: "2026-06-01"
};

describe("quoteDropOff", () => {
  it("quotes the first matching band", () => {
    const q = quoteDropOff(gatwickLike, 10, NOW);
    expect(q.costPence).toBe(1000);
    expect(q.beyondTariff).toBe(false);
  });
  it("picks the correct band in a multi-band tariff", () => {
    expect(quoteDropOff(stanstedLike, 30, NOW).costPence).toBe(2800);
  });
  it("a band boundary stay is included in that band", () => {
    expect(quoteDropOff(stanstedLike, 15, NOW).costPence).toBe(1000);
  });
  it("free airports quote zero", () => {
    expect(quoteDropOff(freeAirport, 45, NOW).costPence).toBe(0);
  });
  it("beyond all bands with a known penalty: null cost + PENALTY_RISK warning", () => {
    const q = quoteDropOff(gatwickLike, 25, NOW);
    expect(q.costPence).toBeNull();
    expect(q.beyondTariff).toBe(true);
    expect(q.warnings.map((w) => w.code)).toContain("PENALTY_RISK");
  });
  it("beyond all bands with unknown penalty: BEYOND_TARIFF_UNKNOWN warning", () => {
    const q = quoteDropOff(stanstedLike, 90, NOW);
    expect(q.costPence).toBeNull();
    expect(q.warnings.map((w) => w.code)).toContain("BEYOND_TARIFF_UNKNOWN");
  });
  it("surfaces the free alternative as a warning", () => {
    const q = quoteDropOff(gatwickLike, 10, NOW);
    const warning = q.warnings.find((w) => w.code === "FREE_ALTERNATIVE_EXISTS");
    expect(warning?.message).toContain("Long Stay car park");
  });
  it("flags stale data (verified more than 60 days ago)", () => {
    const stale = { ...gatwickLike, verifiedAt: "2026-01-01" };
    expect(quoteDropOff(stale, 10, NOW).warnings.map((w) => w.code)).toContain("DATA_UNVERIFIED_RECENTLY");
  });
  it("never throws on out-of-range user input — clamps instead", () => {
    expect(quoteDropOff(gatwickLike, -5, NOW).costPence).toBe(1000);
    expect(quoteDropOff(gatwickLike, 0.4, NOW).costPence).toBe(1000);
  });

  // Fix 1: never throw on malformed tariff penaltyPence
  it("non-integer penaltyPence does not throw and emits BEYOND_TARIFF_UNKNOWN", () => {
    const badPenalty: DropOffTariff = {
      ...gatwickLike,
      penaltyPence: 10000.5
    };
    // 25-min stay is beyond the single 20-min band
    const q = quoteDropOff(badPenalty, 25, NOW);
    expect(q.warnings.map((w) => w.code)).toContain("BEYOND_TARIFF_UNKNOWN");
    expect(q.warnings.map((w) => w.code)).not.toContain("PENALTY_RISK");
  });

  // Fix 2: order-independent band selection (descending bands)
  it("selects the tightest qualifying band when bands are in descending order", () => {
    const descendingBands: DropOffTariff = {
      isFree: false,
      bands: [
        { upToMinutes: 60, totalPence: 2800 },
        { upToMinutes: 15, totalPence: 1000 }
      ],
      maxStayMinutes: 60,
      perMinuteAfterPence: null,
      maxChargePence: null,
      penaltyPence: null,
      freeAlternative: null,
      verifiedAt: "2026-06-01"
    };
    expect(quoteDropOff(descendingBands, 10, NOW).costPence).toBe(1000);
  });

  // Fix 3: malformed verifiedAt must read as stale
  it("non-date verifiedAt emits DATA_UNVERIFIED_RECENTLY without throwing", () => {
    const badDate: DropOffTariff = { ...gatwickLike, verifiedAt: "not-a-date" };
    const q = quoteDropOff(badDate, 10, NOW);
    expect(q.warnings.map((w) => w.code)).toContain("DATA_UNVERIFIED_RECENTLY");
  });

  // Fix 4: effectiveMinutes clamp signal
  it("effectiveMinutes equals 1 when stayMinutes is -5 (clamped)", () => {
    expect(quoteDropOff(gatwickLike, -5, NOW).effectiveMinutes).toBe(1);
  });

  it("effectiveMinutes equals the rounded minutes for a normal call", () => {
    // 10.6 rounds to 11
    expect(quoteDropOff(gatwickLike, 10.6, NOW).effectiveMinutes).toBe(11);
  });

  // Fix 1: honest per-minute tariff continuation after the last band
  describe("per-minute continuation", () => {
    it.each([
      [15, 1500],
      [28, 2800],
      [30, 3000] // capped at maxChargePence £30
    ])("gatwick-like %i min quotes %i pence (per-minute then cap)", (minutes, expected) => {
      const q = quoteDropOff(gatwickPerMinute, minutes, NOW);
      expect(q.costPence).toBe(expected);
      expect(q.beyondTariff).toBe(false);
    });

    it("gatwick-like beyond max stay (40 min) is beyond tariff with null cost", () => {
      const q = quoteDropOff(gatwickPerMinute, 40, NOW);
      expect(q.costPence).toBeNull();
      expect(q.beyondTariff).toBe(true);
    });

    it("respects maxChargePence cap below the linear amount (25 min, cap £20 → £20)", () => {
      const capped: DropOffTariff = { ...gatwickPerMinute, maxChargePence: 2000 };
      expect(quoteDropOff(capped, 25, NOW).costPence).toBe(2000);
    });

    it("london-city-like 8 min quotes £11 (£8 + 3 × £1) with no cap", () => {
      const q = quoteDropOff(londonCityPerMinute, 8, NOW);
      expect(q.costPence).toBe(1100);
      expect(q.beyondTariff).toBe(false);
    });

    it("ignores malformed perMinuteAfterPence and falls through to beyond-tariff", () => {
      const bad: DropOffTariff = { ...gatwickPerMinute, perMinuteAfterPence: 100.5, maxChargePence: null };
      const q = quoteDropOff(bad, 15, NOW);
      expect(q.costPence).toBeNull();
      expect(q.beyondTariff).toBe(true);
    });
  });
});
