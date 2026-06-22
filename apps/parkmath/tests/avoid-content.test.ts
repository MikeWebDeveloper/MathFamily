import { describe, expect, it } from "vitest";
import type { DropOffRecord } from "@mathfamily/data";
import {
  avoidAnswer,
  avoidIndexSummary,
  avoidLeadFacts,
  buildAvoidFaqs,
  buildAvoidSteps,
  qualifiesForAvoidPage
} from "../lib/avoid-content";

const record: DropOffRecord = {
  airportSlug: "gatwick",
  isFree: false,
  feeSummary: "£6 for up to 10 minutes",
  bands: [{ upToMinutes: 10, totalPence: 600 }],
  maxStayMinutes: 10,
  perMinuteAfterPence: null,
  maxChargePence: null,
  penaltyPence: 10000,
  penaltyNotes: "Reduced to £50 if paid within 14 days",
  paymentDeadline: "23:59 the day after drop-off",
  blueBadgePolicy: "Blue Badge holders are exempt if registered in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Free shuttle to the terminal every 10 minutes." },
  priorYearFeePence: 500,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

describe("qualifiesForAvoidPage", () => {
  it("true only when the airport charges AND has a free alternative", () => {
    expect(qualifiesForAvoidPage(record)).toBe(true);
  });
  it("false for free airports", () => {
    expect(qualifiesForAvoidPage({ isFree: true, freeAlternative: record.freeAlternative })).toBe(false);
  });
  it("false for charging airports with no published free alternative", () => {
    expect(qualifiesForAvoidPage({ isFree: false, freeAlternative: null })).toBe(false);
  });
});

describe("avoidAnswer", () => {
  it("names the free alternative and the exact saving, all from data", () => {
    const a = avoidAnswer(record, "London Gatwick");
    expect(a).toContain("£6");
    expect(a).toContain("Long Stay car park");
    expect(a).toContain("30 minutes");
    expect(a).toContain("saves you £6");
  });
});

describe("avoidLeadFacts", () => {
  it("includes only data-backed facts", () => {
    const facts = avoidLeadFacts(record);
    expect(facts.some((f) => f.includes("Long Stay car park"))).toBe(true);
    expect(facts.some((f) => f.includes("£6"))).toBe(true);
    expect(facts.some((f) => f.includes("£100") && f.includes("Penalty"))).toBe(true);
  });
  it("omits payment/penalty facts when that data is null", () => {
    const sparse = { ...record, paymentDeadline: null, penaltyPence: null };
    const facts = avoidLeadFacts(sparse);
    expect(facts.some((f) => f.toLowerCase().includes("pay by"))).toBe(false);
    expect(facts.some((f) => f.toLowerCase().includes("penalty"))).toBe(false);
  });
});

describe("buildAvoidSteps", () => {
  it("leads with the free-alternative step and includes its details + minutes", () => {
    const steps = buildAvoidSteps(record, "London Gatwick");
    expect(steps[0]?.name).toContain("Long Stay car park");
    expect(steps[0]?.text).toContain("30 minutes free");
    expect(steps[0]?.text).toContain("£6");
  });
  it("adds a Blue Badge step only when the policy describes an exemption/discount", () => {
    const steps = buildAvoidSteps(record, "London Gatwick");
    expect(steps.some((s) => s.name.includes("Blue Badge"))).toBe(true);
    const noExempt = { ...record, blueBadgePolicy: "No Blue Badge scheme is published for this airport." };
    expect(buildAvoidSteps(noExempt, "X").some((s) => s.name.includes("Blue Badge"))).toBe(false);
  });
  it("adds a payment-deadline step only when a deadline exists", () => {
    expect(buildAvoidSteps(record, "X").some((s) => s.text.includes("23:59"))).toBe(true);
    const noDeadline = { ...record, paymentDeadline: null };
    expect(buildAvoidSteps(noDeadline, "X").some((s) => s.name.includes("deadline"))).toBe(false);
  });
});

describe("buildAvoidFaqs", () => {
  it("leads with the how-to-avoid question and cites the verified date", () => {
    const faqs = buildAvoidFaqs(record, "London Gatwick");
    expect(faqs[0]?.question).toBe("How do I avoid the London Gatwick drop-off charge?");
    expect(faqs[0]?.answer).toContain("Long Stay car park");
    expect(faqs[0]?.answer).toContain("Verified 2026-06-10");
  });
  it("includes the Blue Badge question verbatim from the policy", () => {
    const bb = buildAvoidFaqs(record, "London Gatwick").find((f) => f.question.includes("Blue Badge"));
    expect(bb?.answer).toBe(record.blueBadgePolicy);
  });
  it("omits the payment-deadline question when there is no deadline", () => {
    const noDeadline = { ...record, paymentDeadline: null };
    expect(buildAvoidFaqs(noDeadline, "X").some((f) => f.question.includes("have to pay"))).toBe(false);
  });
});

describe("public-transport free alternative (honest, no fabricated minutes)", () => {
  const transit: DropOffRecord = {
    ...record,
    airportSlug: "london-city",
    feeSummary: "£8 for up to 5 minutes, then £1 per minute",
    bands: [{ upToMinutes: 5, totalPence: 800 }],
    freeAlternative: {
      name: "Docklands Light Railway (DLR)",
      kind: "public-transport",
      minutesFree: null,
      details: "The DLR reaches the terminal directly."
    }
  };
  it("avoidAnswer never invents a 'free for N minutes' figure", () => {
    const a = avoidAnswer(transit, "London City");
    expect(a).toContain("Docklands Light Railway");
    expect(a).toContain("public transport");
    expect(a).not.toMatch(/free for null/i);
    expect(a).not.toMatch(/null minutes/i);
  });
  it("lead facts describe it as public transport, not minutes", () => {
    const facts = avoidLeadFacts(transit);
    expect(facts.some((f) => f.includes("public transport"))).toBe(true);
    expect(facts.some((f) => /null/.test(f))).toBe(false);
  });
  it("the first step uses the transport details, not 'minutes free'", () => {
    const steps = buildAvoidSteps(transit, "London City");
    expect(steps[0]?.text).toContain("reaches the terminal");
    expect(steps[0]?.text).not.toMatch(/minutes free/i);
  });
  it("FAQs answer honestly without a minutes figure", () => {
    const faqs = buildAvoidFaqs(transit, "London City");
    expect(faqs[0]?.answer).toContain("public transport");
    expect(JSON.stringify(faqs)).not.toMatch(/null minutes|free for null/i);
  });
});

describe("avoidIndexSummary", () => {
  it("counts airports and headlines the biggest single saving", () => {
    const s = avoidIndexSummary([
      { name: "Gatwick", feePence: 600, altName: "Long Stay" },
      { name: "Stansted", feePence: 700, altName: "Mid Stay" }
    ]);
    expect(s).toContain("2 charging UK airports");
    expect(s).toContain("Stansted");
    expect(s).toContain("£7");
    expect(s).toContain("Mid Stay");
  });
  it("handles an empty list", () => {
    expect(avoidIndexSummary([])).toContain("No charging UK airport");
  });
});
