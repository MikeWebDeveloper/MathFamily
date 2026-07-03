import { describe, expect, it } from "vitest";
import type { Airport, DropOffRecord, LoungeRecord, PriorityPassTier } from "@mathfamily/data";
import { bandPriceParenthetical, buildDropOffFaqs, buildDropOffLeague, buildLoungeFaqs, buildPriceIndex, dearestDropOff, dearestWorstCase, dropOffChangeNote, dropOffHubAnswer, dropOffIndexSummary, dropOffPerMinutePence, dropOffTimeLimitNote, dropOffWorstCasePence, freshnessDelta, isPerEntryTariff, nearbyDropOffComparison, paymentDeadlineChip, searchName, trendNote } from "../lib/content";

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
    // Q1 leads with the searched token (Gatwick, not "London Gatwick") + "Airport" to match real queries.
    expect(faqs[0]?.question).toBe("How much is the drop-off charge at Gatwick Airport?");
    expect(faqs[0]?.answer).toContain("£10");
  });
  it("includes pay-after, blue badge, avoid and penalty questions when data exists", () => {
    const questions = buildDropOffFaqs(record, "London Gatwick").map((f) => f.question);
    expect(questions.some((q) => q.includes("after"))).toBe(true);
    expect(questions.some((q) => q.includes("Blue Badge"))).toBe(true);
    expect(questions.some((q) => q.includes("avoid"))).toBe(true);
    // penalty/PCN question surfaces the £100 charge + its reduction
    expect(questions.some((q) => q.toLowerCase().includes("penalty") || q.toLowerCase().includes("don't pay"))).toBe(true);
  });
  it("omits data-driven optional questions when data is null, but still answers 'how to avoid' honestly", () => {
    // Bare charging record: no deadline / alt / penalty. Q1 (how much) + Q2 (conversational
    // "how much does it cost") + Blue Badge + a pick-up Q-match (charging airport → same forecourt
    // charge) + an honest "how do I avoid" answer (no free zone exists → say so). 5 FAQs.
    const sparse: DropOffRecord = { ...record, paymentDeadline: null, freeAlternative: null, penaltyPence: null, penaltyNotes: null, maxStayMinutes: null, bands: [{ upToMinutes: 1, totalPence: 700 }] };
    const faqs = buildDropOffFaqs(sparse, "X");
    expect(faqs).toHaveLength(5);
    expect(faqs.some((f) => f.question.startsWith("How much does it cost to drop off at"))).toBe(true);
    // Pick-up Q-match present even with no free alternative, and never invents a free pick-up zone.
    const pickup = faqs.find((f) => f.question.startsWith("How much is pick-up at"));
    expect(pickup).toBeTruthy();
    expect(pickup?.answer).toContain("same forecourt");
    expect(pickup?.answer).not.toContain("free pick-up");
    const avoid = faqs.find((f) => f.question.includes("avoid"));
    expect(avoid?.answer).toContain("doesn't publish a free drop-off zone");
  });
  it("uses a different question set per airport (no two pages identical)", () => {
    // Stansted has a 2nd band + max stay; Heathrow is per-entry with a PCN; their FAQs must differ.
    const stansted: DropOffRecord = { ...record, airportSlug: "stansted", feeSummary: "£10 for up to 15 minutes, £28 over 15 minutes", bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }], maxStayMinutes: 30, penaltyPence: null, penaltyNotes: "Parking Charge for non-payment", freeAlternative: { name: "Mid Stay", minutesFree: 60, details: "Free shuttle" } };
    const heathrow: DropOffRecord = { ...record, airportSlug: "heathrow", feeSummary: "£7 each time a vehicle enters", bands: [{ upToMinutes: 1, totalPence: 700 }], maxStayMinutes: null, penaltyPence: 8000, penaltyNotes: "£80 PCN, £40 if paid within 14 days" };
    const a = buildDropOffFaqs(stansted, "London Stansted").map((f) => f.question).join("|");
    const b = buildDropOffFaqs(heathrow, "London Heathrow").map((f) => f.question).join("|");
    expect(a).not.toBe(b);
  });
  it("cites the verified date and official source in the fee answer", () => {
    const faqs = buildDropOffFaqs(record, "London Gatwick");
    expect(faqs[0]?.answer).toContain("verified 2026-06-10");
    expect(faqs[0]?.answer).toContain("official London Gatwick");
  });
  it("adds a 'pay … online' Q-match only when the deadline mentions online (Southend harvest)", () => {
    const online: DropOffRecord = { ...record, airportSlug: "southend", paymentDeadline: "Midnight the following day (online, barrierless ANPR)" };
    const onlineFaq = buildDropOffFaqs(online, "London Southend").find((f) => /pay the Southend drop-off charge online/i.test(f.question));
    expect(onlineFaq).toBeTruthy();
    expect(onlineFaq?.answer).toContain("online");
    // Airports whose deadline is not online-based must NOT get the online Q.
    const offline: DropOffRecord = { ...record, paymentDeadline: "Pay at the exit barrier on the day" };
    expect(buildDropOffFaqs(offline, "X").some((f) => /online\?/i.test(f.question))).toBe(false);
  });
  it("conversational FAQ leads number-first with the headline fee", () => {
    const conv = buildDropOffFaqs(record, "London Gatwick").find((f) => f.question.startsWith("How much does it cost to drop off at"));
    expect(conv?.answer).toMatch(/^It costs £10 to drop off/);
  });
});

describe("searchName", () => {
  it("strips a leading 'London ' so titles lead with the searched token", () => {
    expect(searchName("London Stansted")).toBe("Stansted");
    expect(searchName("London Southend")).toBe("Southend");
    expect(searchName("London Heathrow")).toBe("Heathrow");
  });
  it("leaves non-London names unchanged", () => {
    expect(searchName("Bristol")).toBe("Bristol");
    expect(searchName("Manchester")).toBe("Manchester");
  });
  it("does not strip 'London' when it is the whole name (London City)", () => {
    expect(searchName("London City")).toBe("London City");
  });
});

describe("dropOffTimeLimitNote", () => {
  it("describes a single time-limited band", () => {
    const r = { ...record, bands: [{ upToMinutes: 10, totalPence: 850 }], maxStayMinutes: 10 };
    expect(dropOffTimeLimitNote(r)).toContain("10 min");
  });
  it("describes a two-tier band as a tier step", () => {
    const r = { ...record, feeSummary: "£10 for up to 15 minutes, £28 over 15 minutes", bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }], maxStayMinutes: 30 };
    const note = dropOffTimeLimitNote(r)!;
    expect(note).toContain("£28");
    expect(note).toContain("15");
  });
  it("returns null for free or per-entry tariffs", () => {
    expect(dropOffTimeLimitNote({ ...record, isFree: true })).toBeNull();
    expect(dropOffTimeLimitNote({ ...record, bands: [{ upToMinutes: 1, totalPence: 700 }], maxStayMinutes: null })).toBeNull();
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

describe("dropOffPerMinutePence", () => {
  it("divides the headline fee by the minutes it buys", () => {
    // £10 for up to 10 minutes → 100p/min
    expect(dropOffPerMinutePence({ isFree: false, bands: [{ upToMinutes: 10, totalPence: 1000 }] } as any)).toBe(100);
    // £8 for up to 5 minutes → 160p/min
    expect(dropOffPerMinutePence({ isFree: false, bands: [{ upToMinutes: 5, totalPence: 800 }] } as any)).toBe(160);
  });
  it("returns null for free and per-entry tariffs (no honest per-minute figure)", () => {
    expect(dropOffPerMinutePence({ isFree: true, bands: [] } as any)).toBeNull();
    // per-entry: nominal 1-minute band
    expect(dropOffPerMinutePence({ isFree: false, bands: [{ upToMinutes: 1, totalPence: 700 }] } as any)).toBeNull();
  });
});

describe("buildDropOffLeague", () => {
  const recs = [
    { airportSlug: "southend", isFree: false, bands: [{ upToMinutes: 10, totalPence: 800 }] }, // 80p/min
    { airportSlug: "londoncity", isFree: false, bands: [{ upToMinutes: 5, totalPence: 800 }] }, // 160p/min — worst
    { airportSlug: "heathrow", isFree: false, bands: [{ upToMinutes: 1, totalPence: 700 }] }, // per-entry
    { airportSlug: "inverness", isFree: true, bands: [] } // free
  ] as any;
  const name = (s: string) => ({ southend: "Southend", londoncity: "London City", heathrow: "Heathrow", inverness: "Inverness" }[s] ?? s);

  it("ranks worst £/min first, with per-entry and free airports last", () => {
    const league = buildDropOffLeague(recs, name);
    expect(league.map((e) => e.airportSlug)).toEqual(["londoncity", "southend", "heathrow", "inverness"]);
    expect(league[0]!.perMinutePence).toBe(160);
  });
  it("flags per-entry and free entries (no per-minute figure)", () => {
    const league = buildDropOffLeague(recs, name);
    const heathrow = league.find((e) => e.airportSlug === "heathrow")!;
    expect(heathrow.isPerEntry).toBe(true);
    expect(heathrow.perMinutePence).toBeNull();
    expect(league.find((e) => e.airportSlug === "inverness")!.isFree).toBe(true);
  });
});

describe("dropOffHubAnswer", () => {
  const recs = [
    { airportSlug: "southend", isFree: false, bands: [{ upToMinutes: 10, totalPence: 800 }] },
    { airportSlug: "londoncity", isFree: false, bands: [{ upToMinutes: 5, totalPence: 800 }] },
    { airportSlug: "inverness", isFree: true, bands: [] }
  ] as any;
  const name = (s: string) => ({ southend: "Southend", londoncity: "London City", inverness: "Inverness" }[s] ?? s);
  it("leads with counts and the dearest/cheapest + worst £/min, with a verified date", () => {
    const league = buildDropOffLeague(recs, name);
    const ans = dropOffHubAnswer(league, "2026-06-21");
    expect(ans).toContain("2 of the 3");
    expect(ans).toContain("21 June 2026");
    expect(ans).toContain("London City"); // worst £/min
    expect(ans).toContain("/minute");
    expect(ans).toContain("official");
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

describe("buildPriceIndex", () => {
  const free: DropOffRecord = { ...record, airportSlug: "birmingham", isFree: true, bands: [], penaltyPence: null, priorYearFeePence: null };
  const cheap: DropOffRecord = { ...record, airportSlug: "teesside", bands: [{ upToMinutes: 10, totalPence: 250 }], penaltyPence: null, priorYearFeePence: null };
  const dear: DropOffRecord = { ...record, airportSlug: "stansted", bands: [{ upToMinutes: 15, totalPence: 1000 }], penaltyPence: null, priorYearFeePence: null };
  const nameFor = (s: string) => ({ birmingham: "Birmingham", teesside: "Teesside", stansted: "London Stansted", gatwick: "London Gatwick" }[s] ?? s);
  const iataFor = (s: string) => ({ birmingham: "BHX", teesside: "MME", stansted: "STN", gatwick: "LGW" }[s] ?? "???");

  it("ranks free airports first, then cheapest charge to dearest", () => {
    const rows = buildPriceIndex([dear, cheap, free], nameFor, iataFor);
    expect(rows.map((r) => r.airportSlug)).toEqual(["birmingham", "teesside", "stansted"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("never invents a price — reuses the verified figures verbatim", () => {
    const rows = buildPriceIndex([cheap], nameFor, iataFor);
    expect(rows[0]?.fee).toBe("£2.50");
    expect(rows[0]?.feePence).toBe(250);
    expect(rows[0]?.sourceUrl).toBe(cheap.sourceUrl);
    expect(rows[0]?.verifiedAt).toBe(cheap.verifiedAt);
  });

  it("labels free airports and carries the IATA + source per row", () => {
    const rows = buildPriceIndex([free], nameFor, iataFor);
    expect(rows[0]?.fee).toBe("Free");
    expect(rows[0]?.isFree).toBe(true);
    expect(rows[0]?.iata).toBe("BHX");
    expect(rows[0]?.timeLabel).toBe("—");
  });

  it("surfaces a year-on-year note only where a prior-year figure exists", () => {
    // `record` carries priorYearFeePence 700 → 1000 (up £3.00)
    const rows = buildPriceIndex([record, cheap], nameFor, iataFor);
    const gatwick = rows.find((r) => r.airportSlug === "gatwick");
    const teesside = rows.find((r) => r.airportSlug === "teesside");
    expect(gatwick?.yoy).toMatch(/Up £3.*£7.*→.*£10/);
    expect(teesside?.yoy).toBeNull();
  });

  it("surfaces the honest worst-case (max / over-stay) cost per row", () => {
    // Stansted-style two-band record: headline £10/15min, over-stay £28 — the wedge the headline hid.
    const stansted: DropOffRecord = {
      ...record,
      airportSlug: "stansted",
      bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }],
      maxChargePence: null,
      priorYearFeePence: null
    };
    const rows = buildPriceIndex([stansted, cheap, free], nameFor, iataFor);
    const stn = rows.find((r) => r.airportSlug === "stansted");
    expect(stn?.fee).toBe("£10"); // headline unchanged (formatPence drops .00 for whole pounds)
    expect(stn?.worstCasePence).toBe(2800);
    expect(stn?.worstCaseLabel).toBe("£28");
    expect(stn?.hasOverstayStep).toBe(true);
    // Single-band airport: worst case == headline, no over-stay flag.
    const tee = rows.find((r) => r.airportSlug === "teesside");
    expect(tee?.worstCasePence).toBe(250);
    expect(tee?.worstCaseLabel).toBe("£2.50");
    expect(tee?.hasOverstayStep).toBe(false);
    // Free airport: worst case is free, never flagged.
    const bhx = rows.find((r) => r.airportSlug === "birmingham");
    expect(bhx?.worstCasePence).toBe(0);
    expect(bhx?.worstCaseLabel).toBe("Free");
    expect(bhx?.hasOverstayStep).toBe(false);
  });
});

describe("dropOffWorstCasePence", () => {
  it("is the dearest published band for a multi-band airport (Stansted £28)", () => {
    expect(
      dropOffWorstCasePence({
        isFree: false,
        bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }],
        maxChargePence: null
      })
    ).toBe(2800);
  });

  it("uses maxChargePence when it exceeds the published bands (Gatwick £10 headline, £30 cap)", () => {
    // Gatwick has one £10 band but a maxChargePence of £30 — the cap is the honest worst case.
    expect(
      dropOffWorstCasePence({ isFree: false, bands: [{ upToMinutes: 10, totalPence: 1000 }], maxChargePence: 3000 })
    ).toBe(3000);
  });

  it("equals the headline fee for a single-band airport with no cap (never overstates)", () => {
    expect(
      dropOffWorstCasePence({ isFree: false, bands: [{ upToMinutes: 10, totalPence: 800 }], maxChargePence: null })
    ).toBe(800);
  });

  it("is 0 for free airports and null when nothing is published", () => {
    expect(dropOffWorstCasePence({ isFree: true, bands: [], maxChargePence: null })).toBe(0);
    expect(dropOffWorstCasePence({ isFree: false, bands: [], maxChargePence: null })).toBeNull();
  });
});

describe("dearestWorstCase", () => {
  it("picks the airport with the dearest worst-case, not the dearest headline", () => {
    // Manchester's headline (£5) is cheaper than Gatwick's (£10), but its £25 over-stay tier beats
    // Gatwick's £30 cap... so Gatwick should still win at £30. Verifies it ranks on the worst case.
    const manchester = {
      airportSlug: "manchester",
      isFree: false,
      bands: [{ upToMinutes: 5, totalPence: 500 }, { upToMinutes: 30, totalPence: 2500 }],
      maxChargePence: null
    };
    const gatwick = {
      airportSlug: "gatwick",
      isFree: false,
      bands: [{ upToMinutes: 10, totalPence: 1000 }],
      maxChargePence: 3000
    };
    const stansted = {
      airportSlug: "stansted",
      isFree: false,
      bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }],
      maxChargePence: null
    };
    const winner = dearestWorstCase([manchester, stansted, gatwick]);
    expect(winner).toEqual({ airportSlug: "gatwick", pence: 3000 });
  });

  it("ignores free airports and returns null when nothing charges", () => {
    expect(dearestWorstCase([{ airportSlug: "inverness", isFree: true, bands: [], maxChargePence: null }])).toBeNull();
  });
});

describe("dropOffChangeNote", () => {
  it("surfaces the dated step-up when penaltyNotes carries a (from <date>) pattern (Stansted's £28 rise)", () => {
    const note = dropOffChangeNote(
      {
        isFree: false,
        bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }],
        penaltyNotes: "£28 tier applies to stays over 15 minutes (from 19 March 2026); a Parking Charge may also be issued"
      },
      "Stansted Airport"
    );
    expect(note).toContain("19 March 2026");
    expect(note).toContain("£28");
    expect(note).toContain("£10");
  });

  it("returns null when there's no dated pattern in penaltyNotes", () => {
    expect(
      dropOffChangeNote(
        { isFree: false, bands: [{ upToMinutes: 20, totalPence: 1000 }, { upToMinutes: 40, totalPence: 2000 }], penaltyNotes: "Standard PCN applies" },
        "Gatwick"
      )
    ).toBeNull();
  });

  it("returns null for free airports and single-band (non-stepped) tariffs", () => {
    expect(dropOffChangeNote({ isFree: true, bands: [], penaltyNotes: null }, "Manchester")).toBeNull();
    expect(
      dropOffChangeNote({ isFree: false, bands: [{ upToMinutes: 1, totalPence: 700 }], penaltyNotes: "(from 1 January 2026)" }, "Heathrow")
    ).toBeNull();
  });
});

describe("nearbyDropOffComparison", () => {
  const heathrow: Airport = { name: "London Heathrow", slug: "heathrow", iata: "LHR", region: "London", lat: 51.47, lng: -0.4543 };
  const luton: Airport = { name: "London Luton", slug: "luton", iata: "LTN", region: "London", lat: 51.8747, lng: -0.3683 };
  const londonCity: Airport = { name: "London City", slug: "london-city", iata: "LCY", region: "London", lat: 51.5053, lng: 0.0553 };
  const southend: Airport = { name: "London Southend", slug: "southend", iata: "SEN", region: "East of England", lat: 51.5714, lng: 0.6956 };
  const stansted: Airport = { name: "London Stansted", slug: "stansted", iata: "STN", region: "London", lat: 51.886, lng: 0.2389 };
  const allAirports = [heathrow, luton, londonCity, southend, stansted];
  const allRecords: Pick<DropOffRecord, "airportSlug" | "isFree" | "bands">[] = [
    { airportSlug: "heathrow", isFree: false, bands: [{ upToMinutes: 1, totalPence: 700 }] },
    { airportSlug: "luton", isFree: false, bands: [{ upToMinutes: 10, totalPence: 700 }] },
    { airportSlug: "london-city", isFree: false, bands: [{ upToMinutes: 5, totalPence: 800 }] },
    { airportSlug: "southend", isFree: true, bands: [] },
    { airportSlug: "stansted", isFree: false, bands: [{ upToMinutes: 15, totalPence: 1000 }, { upToMinutes: 30, totalPence: 2800 }] }
  ];

  it("always leads with Heathrow (the benchmark) when the airport itself isn't Heathrow", () => {
    const rows = nearbyDropOffComparison(stansted, allAirports, allRecords, 3);
    expect(rows[0]?.slug).toBe("heathrow");
    expect(rows[0]?.fee).toBe("£7");
  });

  it("never includes the airport being compared against itself", () => {
    const rows = nearbyDropOffComparison(stansted, allAirports, allRecords, 5);
    expect(rows.some((r) => r.slug === "stansted")).toBe(false);
  });

  it("doesn't duplicate Heathrow as its own benchmark when Heathrow is the subject airport", () => {
    const rows = nearbyDropOffComparison(heathrow, allAirports, allRecords, 3);
    expect(rows.filter((r) => r.slug === "heathrow")).toHaveLength(0);
  });

  it("labels a free comparator's fee as 'Free'", () => {
    const rows = nearbyDropOffComparison(stansted, allAirports, allRecords, 5);
    const se = rows.find((r) => r.slug === "southend");
    expect(se?.isFree).toBe(true);
    expect(se?.fee).toBe("Free");
  });

  it("respects the count cap", () => {
    expect(nearbyDropOffComparison(stansted, allAirports, allRecords, 2)).toHaveLength(2);
  });

  it("skips a candidate airport that has no drop-off record", () => {
    const noRecord = allRecords.filter((r) => r.airportSlug !== "luton");
    const rows = nearbyDropOffComparison(stansted, allAirports, noRecord, 5);
    expect(rows.some((r) => r.slug === "luton")).toBe(false);
  });
});
