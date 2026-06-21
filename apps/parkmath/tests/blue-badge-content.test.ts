import { describe, expect, it } from "vitest";
import type { DropOffRecord } from "@mathfamily/data";
import {
  blueBadgeAnswer,
  blueBadgeHasProcess,
  blueBadgeIndexRow,
  blueBadgeIndexSummary,
  blueBadgeLeadFacts,
  blueBadgeSortRank,
  blueBadgeStatusLabel,
  buildBlueBadgeFaqs,
  buildBlueBadgeSteps,
  classifyBlueBadge,
  qualifiesForBlueBadgePage,
  type BlueBadgeIndexRow
} from "../lib/blue-badge-content";

/** A charging airport whose policy is a full exemption (Heathrow-shaped). */
const exemptRecord: DropOffRecord = {
  airportSlug: "heathrow",
  isFree: false,
  feeSummary: "£7 each time a vehicle enters a terminal drop-off zone",
  bands: [{ upToMinutes: 1, totalPence: 700 }],
  maxStayMinutes: null,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: 8000,
  penaltyNotes: "£80 PCN, reduced to £40 if paid within 14 days",
  paymentDeadline: "Midnight the day after your visit",
  blueBadgePolicy: "Blue Badge holders can apply for a 100% discount using the vehicle registration number, up to 3 months in advance",
  freeAlternative: { name: "Park & Ride", minutesFree: 30, details: "Free shuttle every 15 minutes." },
  priorYearFeePence: 600,
  sourceUrl: "https://www.heathrow.com/drop-off",
  verifiedAt: "2026-06-10"
};

/** A charging airport with only a reduced concession (Bristol-shaped: still pays £8.50). */
const reducedRecord: DropOffRecord = {
  ...exemptRecord,
  airportSlug: "bristol",
  bands: [{ upToMinutes: 10, totalPence: 850 }],
  blueBadgePolicy: "Blue Badge holders: up to 40 minutes in the Drop Off & Pick Up car park for £8.50 — scan the badge at the exit barrier",
  freeAlternative: { name: "Waiting Zone", minutesFree: 60, details: "Free shuttle every 15 minutes." }
};

/** A charging airport that publishes no concession (Luton-shaped). */
const noneRecord: DropOffRecord = {
  ...exemptRecord,
  airportSlug: "luton",
  bands: [{ upToMinutes: 10, totalPence: 700 }],
  blueBadgePolicy: "No concessions are available for Blue Badge holders in the main Express Drop Off area",
  freeAlternative: { name: "Long Stay car park", minutesFree: 120, details: "Free shuttle every 20 minutes." }
};

/** A free airport with a badge window (Inverness-shaped). */
const freeRecord: DropOffRecord = {
  ...exemptRecord,
  airportSlug: "inverness",
  isFree: true,
  bands: [],
  penaltyPence: null,
  penaltyNotes: null,
  paymentDeadline: null,
  blueBadgePolicy: "Blue Badge holders and Special Assistance passengers: up to 20 minutes free in the Premium car park in front of the terminal",
  freeAlternative: { name: "Free Drop Off area", minutesFree: 15, details: "Five-minute walk to the terminal." }
};

/** A charging airport that gives a genuine free window in a named car park (East Midlands-shaped:
 *  text mentions "no specific … concession" for one area BUT a free window in another). */
const freeWindowRecord: DropOffRecord = {
  ...exemptRecord,
  airportSlug: "east-midlands",
  bands: [{ upToMinutes: 15, totalPence: 500 }],
  blueBadgePolicy:
    "Blue Badge holders get up to 30 minutes free at Short Stay 1 (nearest the terminal); No specific Blue Badge concession is published for the Rapid Drop-off area",
  freeAlternative: { name: "Long Stay 2 car park", minutesFree: 60, details: "Free shuttle bus." }
};

describe("classifyBlueBadge", () => {
  it("treats a 100% discount / exempt / free-of-charge-where as exempt", () => {
    expect(classifyBlueBadge(exemptRecord.blueBadgePolicy)).toBe("exempt");
    expect(classifyBlueBadge("Blue Badge holders are exempt from the drop-off charge")).toBe("exempt");
    expect(classifyBlueBadge("The Drop Off Zone is free of charge where the passenger holds a Blue Badge")).toBe("exempt");
  });
  it("treats a free time window as free-window (and ranks a genuine window above a 'no concession' aside)", () => {
    expect(classifyBlueBadge(freeRecord.blueBadgePolicy)).toBe("free-window");
    expect(classifyBlueBadge(freeWindowRecord.blueBadgePolicy)).toBe("free-window");
    expect(classifyBlueBadge("Vehicles carrying passengers with Blue Badges have free access to the car parks for one hour")).toBe("free-window");
  });
  it("treats a still-charged concession as reduced", () => {
    expect(classifyBlueBadge(reducedRecord.blueBadgePolicy)).toBe("reduced");
    expect(classifyBlueBadge("Normal charges apply, but the driver is eligible for an extension to the maximum stay")).toBe("reduced");
  });
  it("treats silence / no-concession wording as none", () => {
    expect(classifyBlueBadge(noneRecord.blueBadgePolicy)).toBe("none");
    expect(classifyBlueBadge("Not specifically stated on the official page; a special assistance vehicle is available")).toBe("none");
    expect(classifyBlueBadge("No specific Express drop-off Blue Badge concession is published online")).toBe("none");
  });
});

describe("qualifiesForBlueBadgePage", () => {
  it("true when a policy string exists", () => {
    expect(qualifiesForBlueBadgePage(exemptRecord)).toBe(true);
  });
  it("false for an empty policy (defensive)", () => {
    expect(qualifiesForBlueBadgePage({ blueBadgePolicy: "   " })).toBe(false);
  });
});

describe("blueBadgeAnswer", () => {
  it("exempt: says free and includes the waived fee, all from data, and quotes the policy", () => {
    const a = blueBadgeAnswer(exemptRecord, "Heathrow");
    expect(a).toContain("free");
    expect(a).toContain("£7");
    expect(a).toContain("100% discount"); // verbatim policy embedded
  });
  it("none: never claims free, names the charge, quotes the policy", () => {
    const a = blueBadgeAnswer(noneRecord, "Luton");
    expect(a).toContain("no Blue Badge concession");
    expect(a).toContain("£7");
    expect(a).not.toMatch(/drop off free|exempt/i);
    expect(a).toContain("No concessions are available");
  });
  it("reduced: states it is NOT waived but a concession exists", () => {
    const a = blueBadgeAnswer(reducedRecord, "Bristol");
    expect(a).toMatch(/does not waive/i);
    expect(a).toContain("£8.50");
  });
  it("free airport: says free for everyone, no fee invented", () => {
    const a = blueBadgeAnswer(freeRecord, "Inverness");
    expect(a).toContain("free for everyone");
    expect(a).not.toContain("£"); // free record has no band fee to quote
  });
});

describe("blueBadgeStatusLabel", () => {
  it("maps each kind to an honest short label", () => {
    expect(blueBadgeStatusLabel(exemptRecord)).toMatch(/Exempt/);
    expect(blueBadgeStatusLabel(reducedRecord)).toMatch(/not free/i);
    expect(blueBadgeStatusLabel(noneRecord)).toMatch(/No concession/i);
    expect(blueBadgeStatusLabel(freeRecord)).toMatch(/Free for all/);
  });
});

describe("blueBadgeLeadFacts", () => {
  it("includes only data-backed facts and the standard charge", () => {
    const facts = blueBadgeLeadFacts(exemptRecord);
    expect(facts.some((f) => f.includes("£7"))).toBe(true);
    expect(facts.some((f) => f.includes("Park & Ride"))).toBe(true);
    expect(facts.some((f) => f.includes("£80"))).toBe(true);
  });
  it("omits the registration step for a 'none' airport", () => {
    const facts = blueBadgeLeadFacts(noneRecord);
    expect(facts.some((f) => /register the vehicle/i.test(f))).toBe(false);
  });
});

describe("blueBadgeHasProcess", () => {
  it("true when the policy describes register/validate/claim/scan/apply", () => {
    expect(blueBadgeHasProcess(exemptRecord)).toBe(true); // "apply"
    expect(blueBadgeHasProcess(reducedRecord)).toBe(true); // "scan the badge"
  });
  it("false when the policy describes no actionable process", () => {
    expect(blueBadgeHasProcess(noneRecord)).toBe(false);
  });
});

describe("buildBlueBadgeSteps", () => {
  it("builds steps only when a process exists, embedding the verbatim policy", () => {
    const steps = buildBlueBadgeSteps(exemptRecord, "Heathrow");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((s) => s.text.includes("100% discount"))).toBe(true);
    expect(steps.some((s) => s.text.includes("Midnight the day after"))).toBe(true);
  });
  it("returns no steps for a no-process airport (no fabricated HowTo)", () => {
    expect(buildBlueBadgeSteps(noneRecord, "Luton")).toEqual([]);
  });
});

describe("buildBlueBadgeFaqs", () => {
  it("answers 'is it free' honestly per kind", () => {
    expect(buildBlueBadgeFaqs(exemptRecord, "Heathrow")[0]!.answer).toMatch(/Yes/);
    expect(buildBlueBadgeFaqs(noneRecord, "Luton")[0]!.answer).toMatch(/^No/);
    expect(buildBlueBadgeFaqs(reducedRecord, "Bristol")[0]!.answer).toMatch(/Not outright/);
  });
  it("surfaces the free-for-everyone alternative and the penalty when present", () => {
    const faqs = buildBlueBadgeFaqs(exemptRecord, "Heathrow");
    expect(faqs.some((f) => f.answer.includes("Park & Ride"))).toBe(true);
    expect(faqs.some((f) => f.question.includes("without using the Blue Badge concession"))).toBe(true);
  });
});

describe("blueBadgeIndexSummary", () => {
  function row(over: Partial<BlueBadgeIndexRow>): BlueBadgeIndexRow {
    return { slug: "x", name: "X", kind: "exempt", isFree: false, feePence: 700, statusLabel: "Exempt — free if registered", ...over };
  }
  it("counts each bucket honestly", () => {
    const rows = [
      row({ kind: "exempt" }),
      row({ kind: "free-window" }),
      row({ kind: "reduced" }),
      row({ kind: "none" }),
      row({ isFree: true, feePence: null })
    ];
    const s = blueBadgeIndexSummary(rows);
    expect(s).toContain("5 UK airports");
    expect(s).toMatch(/1 fully waive/);
    expect(s).toMatch(/1 publish no/);
    expect(s).toMatch(/1 are free for everyone/);
  });
  it("empty case is honest", () => {
    expect(blueBadgeIndexSummary([])).toMatch(/don't yet hold/);
  });
});

describe("blueBadgeIndexRow + blueBadgeSortRank", () => {
  it("ranks free/exempt above concessions above none", () => {
    const exempt = blueBadgeIndexRow(exemptRecord, "Heathrow");
    const reduced = blueBadgeIndexRow(reducedRecord, "Bristol");
    const none = blueBadgeIndexRow(noneRecord, "Luton");
    const free = blueBadgeIndexRow(freeRecord, "Inverness");
    expect(blueBadgeSortRank(free)).toBeLessThan(blueBadgeSortRank(exempt));
    expect(blueBadgeSortRank(exempt)).toBeLessThan(blueBadgeSortRank(reduced));
    expect(blueBadgeSortRank(reduced)).toBeLessThan(blueBadgeSortRank(none));
  });
});

/** Guard the whole real dataset: every record classifies, and no answer fabricates a £0 for a
 *  charging airport that the policy classifies as 'none' or 'reduced'. */
describe("real dataset honesty guard", () => {
  it("classifies all real records and never claims free for a none/reduced charging airport", async () => {
    const { loadDropOffDataset, loadAirports } = await import("@mathfamily/data");
    const airports = new Map(loadAirports().map((a) => [a.slug, a.name]));
    for (const r of loadDropOffDataset().records) {
      const kind = classifyBlueBadge(r.blueBadgePolicy);
      expect(["exempt", "free-window", "reduced", "none"]).toContain(kind);
      const answer = blueBadgeAnswer(r, airports.get(r.airportSlug) ?? r.airportSlug);
      // The answer must always embed the verbatim policy (never replace it with our own claim).
      expect(answer).toContain(r.blueBadgePolicy);
      if (!r.isFree && (kind === "none" || kind === "reduced")) {
        expect(answer).not.toMatch(/can drop off free|are exempt|charge is waived/i);
      }
    }
  });
});
