import { describe, expect, it } from "vitest";
import type { DropOffRecord, LoungeRecord, PriorityPassTier } from "@mathfamily/data";
import { bandPriceParenthetical, buildDropOffFaqs, buildLoungeFaqs, dearestDropOff, dropOffIndexSummary, freshnessDelta, isPerEntryTariff, paymentDeadlineChip, trendNote } from "../lib/content";

const record: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£10 for up to 20 minutes",
  bands: [{ upToMinutes: 20, totalPence: 1000 }],
  maxStayMinutes: 20,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £50 if paid within 14 days",
  paymentDeadline: "23:59 the day after drop-off",
  blueBadgePolicy: "Exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Shuttle to terminal" },
  priorYearFeePence: 700,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

describe("buildDropOffFaqs", () => {
  it("always includes the how-much question", () => {
    const faqs = buildDropOffFaqs(record, "London Gatwick");
    expect(faqs[0]?.question).toBe("How much is the drop-off charge at London Gatwick?");
    expect(faqs[0]?.answer).toContain("£10");
  });
  it("includes pay-after, blue badge and avoid questions when data exists", () => {
    const questions = buildDropOffFaqs(record, "London Gatwick").map((f) => f.question);
    expect(questions).toHaveLength(4);
    expect(questions.some((q) => q.includes("after"))).toBe(true);
    expect(questions.some((q) => q.includes("Blue Badge"))).toBe(true);
    expect(questions.some((q) => q.includes("avoid"))).toBe(true);
  });
  it("omits optional questions when data is null", () => {
    const sparse = { ...record, paymentDeadline: null, freeAlternative: null };
    expect(buildDropOffFaqs(sparse, "X")).toHaveLength(2);
  });
  it("cites the verified date and official source in the fee answer", () => {
    const faqs = buildDropOffFaqs(record, "London Gatwick");
    expect(faqs[0]?.answer).toContain("verified 2026-06-10");
    expect(faqs[0]?.answer).toContain("official London Gatwick");
  });
});

describe("dropOffIndexSummary", () => {
  it("summarises free count, cheapest paid and dearest", () => {
    const s = dropOffIndexSummary([
      { name: "Birmingham", isFree: true, feePence: 0 },
      { name: "Inverness", isFree: true, feePence: 0 },
      { name: "Bristol", isFree: false, feePence: 850 },
      { name: "Gatwick", isFree: false, feePence: 1000 }
    ]);
    expect(s).toContain("2 of 4");
    expect(s).toContain("Bristol");
    expect(s).toContain("£8.50");
    expect(s).toContain("Gatwick");
    expect(s).toContain("£10");
  });
});

describe("dearestDropOff", () => {
  const mk = (slug: string, isFree: boolean, bands: { upToMinutes: number; totalPence: number }[]) =>
    ({ airportSlug: slug, isFree, bands }) as Pick<DropOffRecord, "airportSlug" | "isFree" | "bands">;
  it("ranks by the headline band (bands[0]), ignoring long-stay tiers / overstay bands", () => {
    // Bristol's £60/120-min tier must NOT win — its headline (bands[0]) is £8.50; Gatwick £10 wins.
    const d = dearestDropOff([
      mk("bristol", false, [{ upToMinutes: 10, totalPence: 850 }, { upToMinutes: 60, totalPence: 3000 }, { upToMinutes: 120, totalPence: 6000 }]),
      mk("gatwick", false, [{ upToMinutes: 10, totalPence: 1000 }]),
      mk("stansted", false, [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }]),
      mk("inverness", true, [])
    ]);
    expect(d).toEqual({ airportSlug: "gatwick", pence: 1000, upToMinutes: 10 });
  });
  it("returns null when every airport is free", () => {
    expect(dearestDropOff([mk("x", true, [])])).toBeNull();
  });
});

describe("trendNote", () => {
  it("describes a rise vs prior year", () => {
    expect(trendNote(record)).toBe("Up £3 vs 2025 (£7 → £10)");
  });
  it("returns null without prior-year data", () => {
    expect(trendNote({ ...record, priorYearFeePence: null })).toBeNull();
  });
  it("returns null for free airports", () => {
    expect(trendNote({ ...record, isFree: true, bands: [] })).toBeNull();
  });
  it("frames a brand-new charge (prior year was free) without an up/down delta", () => {
    const newCharge = { ...record, priorYearFeePence: 0, bands: [{ upToMinutes: 5, totalPence: 800 }] };
    expect(trendNote(newCharge)).toBe("New charge for 2026 (£8)");
  });
});

describe("paymentDeadlineChip", () => {
  it("returns the real deadline, not generic copy", () => {
    expect(paymentDeadlineChip({ paymentDeadline: "midnight on the day of your visit" } as any)).toBe("Pay by: midnight on the day of your visit");
  });
  it("returns null when there is no deadline", () => {
    expect(paymentDeadlineChip({ paymentDeadline: null } as any)).toBeNull();
  });
});

describe("freshnessDelta", () => {
  const base = { isFree: false, bands: [{ totalPence: 600, upToMinutes: 10 }] };
  it("'unchanged' when this year equals last", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: 600 } as any)).toBe("Unchanged vs last year");
  });
  it("'up' when dearer than last year", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: 500 } as any)).toBe("Up £1.00 vs last year");
  });
  it("null when no prior-year data or free", () => {
    expect(freshnessDelta({ ...base, priorYearFeePence: null } as any)).toBeNull();
    expect(freshnessDelta({ isFree: true, bands: [], priorYearFeePence: 500 } as any)).toBeNull();
  });
});

describe("isPerEntryTariff", () => {
  it("true for a flat per-entry record (nominal 1-minute band)", () => {
    expect(isPerEntryTariff({ ...record, bands: [{ upToMinutes: 1, totalPence: 700 }] })).toBe(true);
  });
  it("false for duration-banded and free records", () => {
    expect(isPerEntryTariff(record)).toBe(false);
    expect(isPerEntryTariff({ ...record, isFree: true, bands: [] })).toBe(false);
  });
});

describe("bandPriceParenthetical", () => {
  it("returns null when feeSummary already leads with the band price (avoids duplication)", () => {
    // feeSummary "£10 for up to 20 minutes" already contains the band phrasing
    expect(bandPriceParenthetical(record)).toBeNull();
    expect(
      bandPriceParenthetical({
        ...record,
        feeSummary: "£10 for up to 10 minutes, then £1 per additional minute (max stay 30 minutes)",
        bands: [{ upToMinutes: 10, totalPence: 1000 }]
      })
    ).toBeNull();
  });
  it("returns the concrete anchor when feeSummary does not state the band price", () => {
    expect(
      bandPriceParenthetical({
        ...record,
        feeSummary: "£7 each time a vehicle enters a terminal drop-off zone",
        bands: [{ upToMinutes: 10, totalPence: 700 }]
      })
    ).toBe("£7 for up to 10 minutes");
  });
  it("returns null for free records or records without a band", () => {
    expect(bandPriceParenthetical({ ...record, isFree: true, bands: [] })).toBeNull();
    expect(bandPriceParenthetical({ ...record, bands: [] })).toBeNull();
  });
});

const loungeRecord: LoungeRecord = {
  airportSlug: "manchester",
  lounges: [
    { name: "Escape Lounge T1", walkInPence: 2750, priorityPass: true, notes: "Pre-booking recommended; Priority Pass accepted pre-booking only." },
    { name: "1903 Lounge", walkInPence: 3500, priorityPass: false, notes: null }
  ],
  sourceUrl: "https://www.manchesterairport.co.uk/lounges",
  verifiedAt: "2026-06-09"
};
const ppTiers: PriorityPassTier[] = [
  { tier: "Standard", annualFeePence: 9900, includedVisits: 0, perVisitPence: 3500 },
  { tier: "Standard Plus", annualFeePence: 24900, includedVisits: 10, perVisitPence: 3500 }
];

describe("buildLoungeFaqs", () => {
  it("leads with the cost question using the cheapest pre-book price", () => {
    const faqs = buildLoungeFaqs(loungeRecord, "Manchester", ppTiers);
    expect(faqs[0]?.question).toBe("How much does an airport lounge cost at Manchester?");
    expect(faqs[0]?.answer).toContain("£27.50");
  });
  it("lists the Priority Pass lounges by name", () => {
    const pp = buildLoungeFaqs(loungeRecord, "Manchester", ppTiers).find((f) => f.question.includes("Priority Pass"));
    expect(pp?.answer).toContain("Escape Lounge T1");
  });
  it("surfaces per-lounge notes, only where notes exist", () => {
    const notesFaqs = buildLoungeFaqs(loungeRecord, "Manchester", ppTiers).filter((f) => f.question.startsWith("What should I know"));
    expect(notesFaqs).toHaveLength(1);
    expect(notesFaqs[0]?.answer).toContain("Pre-booking recommended");
  });
  it("includes a membership break-even question when a price exists", () => {
    expect(buildLoungeFaqs(loungeRecord, "Manchester", ppTiers).some((f) => f.question.toLowerCase().includes("worth it"))).toBe(true);
  });
  it("handles airports with no published prices and skips the break-even question", () => {
    const sparse: LoungeRecord = { ...loungeRecord, lounges: [{ name: "Aspire", walkInPence: null, priorityPass: false, notes: null }] };
    const faqs = buildLoungeFaqs(sparse, "Leeds Bradford", ppTiers);
    expect(faqs[0]?.answer).toContain("aren't published");
    expect(faqs.some((f) => f.question.toLowerCase().includes("worth it"))).toBe(false);
  });
});
