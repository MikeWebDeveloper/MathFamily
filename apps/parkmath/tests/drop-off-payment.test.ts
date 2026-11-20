import { describe, expect, it } from "vitest";
import { loadAirports, loadDropOffDataset, type DropOffRecord } from "@mathfamily/data";
import { avoidLeadFacts, buildAvoidFaqs, buildAvoidSteps } from "../lib/avoid-content";
import { buildBlueBadgeFaqs, buildBlueBadgeSteps } from "../lib/blue-badge-content";
import { buildDropOffFaqs, dropOffHowToPay, dropOffPaymentMode, paymentDeadlineChip, payByPhrase } from "../lib/content";
import { payInstructionWithPenalty } from "../lib/payment";

const records = loadDropOffDataset().records;
const bySlug = (slug: string) => records.find((r) => r.airportSlug === slug)!;
const nameOf = (slug: string) => loadAirports().find((a) => a.slug === slug)!.name;
const withDeadline = (paymentDeadline: string | null): DropOffRecord => ({ ...bySlug("stansted"), paymentDeadline });

describe("dropOffPaymentMode", () => {
  it("reads 'pay later' only from a deadline the airport states (midnight / 23:59 / day after)", () => {
    expect(dropOffPaymentMode(withDeadline("23:59 the day after your visit"))).toBe("pay-later");
    expect(dropOffPaymentMode(withDeadline("Midnight the following day (online, barrierless ANPR)"))).toBe("pay-later");
    // "Barrier-free … payment cannot be made on exit" mentions a barrier and exit but is pay-later.
    expect(dropOffPaymentMode(withDeadline("Barrier-free — pay online by midnight the day after your visit (payment cannot be made on exit; no cash or cheque)"))).toBe("pay-later");
  });
  it("reads 'pay on exit' from barrier / on-exit wording", () => {
    expect(dropOffPaymentMode(withDeadline("Pay on exit at the barrier (pull up on the day, pay on leaving)"))).toBe("pay-on-exit");
    expect(dropOffPaymentMode(withDeadline("Card / contactless / Apple Pay / Google Pay at the exit barrier"))).toBe("pay-on-exit");
    expect(dropOffPaymentMode(withDeadline("Ticketless ANPR barrier system; monitored 24/7"))).toBe("pay-on-exit");
  });
  it("never reads barrierless / barrier-free / online wording without a deadline as pay-on-exit", () => {
    // A wrong "No — you pay as you leave" is the same class of bug as the old wrong "Yes".
    expect(dropOffPaymentMode(withDeadline("Online, barrierless ANPR"))).toBe("unknown");
    expect(dropOffPaymentMode(withDeadline("Barrier-free — pay online"))).toBe("unknown");
    expect(dropOffPaymentMode(withDeadline("Pay online via the airport website"))).toBe("unknown");
  });
  it("claims nothing when the airport publishes no payment wording, or wording it can't classify", () => {
    expect(dropOffPaymentMode(withDeadline(null))).toBe("unknown");
    expect(dropOffPaymentMode(withDeadline("See the official page"))).toBe("unknown");
  });
  it("classifies the live dataset the way each airport's own wording reads", () => {
    for (const slug of ["heathrow", "gatwick", "manchester", "stansted", "luton", "london-city", "east-midlands", "southend"]) {
      expect(dropOffPaymentMode(bySlug(slug)), slug).toBe("pay-later");
    }
    for (const slug of ["newcastle", "liverpool", "leeds-bradford", "aberdeen", "southampton", "exeter", "bournemouth", "norwich", "teesside"]) {
      expect(dropOffPaymentMode(bySlug(slug)), slug).toBe("pay-on-exit");
    }
  });
});

describe("payByPhrase", () => {
  it("lifts the deadline out of the airport's wording, never the surrounding text", () => {
    expect(payByPhrase(withDeadline("Midnight the day after your visit (can also pay in advance or on the day)"))).toBe("midnight the day after your visit");
    expect(payByPhrase(withDeadline("Barrier-free — pay online by midnight the day after your visit (payment cannot be made on exit; no cash or cheque)"))).toBe("midnight the day after your visit");
    expect(payByPhrase(withDeadline("23:59 the day after your visit"))).toBe("23:59 the day after your visit");
    expect(payByPhrase(withDeadline("Pay on exit at the barrier"))).toBeNull();
  });
});

describe("paymentDeadlineChip", () => {
  it("says 'Pay on exit' for barrier airports instead of 'Pay by: <barrier wording>'", () => {
    expect(paymentDeadlineChip(bySlug("newcastle"))).toBe("Pay on exit");
    expect(paymentDeadlineChip(bySlug("stansted"))).toBe("Pay by: 23:59 the day after your visit");
    expect(paymentDeadlineChip(bySlug("east-midlands"))).toBe("Pay by: midnight the day after your visit");
  });
});

describe("drop-off FAQ never tells a barrier airport's visitor they can pay after leaving", () => {
  for (const r of records.filter((x) => x.paymentDeadline)) {
    it(r.airportSlug, () => {
      const faqs = buildDropOffFaqs(r, nameOf(r.airportSlug));
      const afterLeaving = faqs.find((f) => /after I leave/.test(f.question));
      const mode = dropOffPaymentMode(r);
      if (mode === "pay-on-exit") expect(afterLeaving?.answer, afterLeaving?.answer).toMatch(/^No\b/);
      if (mode === "pay-later") expect(afterLeaving?.answer).toMatch(/^Yes — pay by (midnight|23:59)/);
      // No FAQ answer may splice barrier wording into a "pay by …" sentence.
      for (const f of faqs) expect(f.answer, `${r.airportSlug}: ${f.answer}`).not.toMatch(/(pay|settle)[^.]* by (Ticketless|Card|Cash|Contactless|Pay on exit|ANPR|Barrier-free)/i);
      // Every paying airport with published wording answers the dominant "how to pay" query.
      expect(faqs.some((f) => f.question === `How do I pay the ${searchNameOf(r)} drop-off charge?`)).toBe(true);
    });
  }
});

function searchNameOf(r: DropOffRecord): string {
  // Mirrors searchName(): "London Stansted" → "Stansted" etc. Read from the FAQ's own Q1 instead of
  // re-implementing it: "How much is the drop-off charge at <search> Airport?"
  const q1 = buildDropOffFaqs(r, nameOf(r.airportSlug))[0]!.question;
  return q1.replace(/^How much is the drop-off charge at /, "").replace(/ Airport\?$/, "");
}

describe("no page says '<airport> lets you pay by <barrier wording>'", () => {
  // The Blue Badge and avoid pages had the same splice: "Newcastle International Airport lets you pay
  // by Ticketless ANPR — appropriate tariff is requested and paid on exit …".
  const SPLICE = /(pay|settle)[^.]* by:? (Ticketless|Card|Cash|Contactless|Pay on exit|ANPR|Barrier-free)/i;
  for (const r of records) {
    it(r.airportSlug, () => {
      const name = nameOf(r.airportSlug);
      const texts = [
        ...buildBlueBadgeSteps(r, name).map((s) => s.text),
        ...buildBlueBadgeFaqs(r, name).map((f) => f.answer),
        ...buildAvoidSteps(r, name).map((s) => s.text),
        ...buildAvoidFaqs(r, name).map((f) => f.answer),
        ...avoidLeadFacts(r),
        payInstructionWithPenalty(r, name) ?? ""
      ];
      for (const t of texts) {
        expect(t, `${r.airportSlug}: ${t}`).not.toMatch(SPLICE);
        if (/lets you pay by/.test(t)) expect(t, t).toMatch(/lets you pay by (midnight|23:59)/);
      }
    });
  }
});

describe("dropOffHowToPay", () => {
  it("is absent for free airports", () => {
    expect(dropOffHowToPay(bySlug("birmingham"), "Birmingham Airport")).toBeNull();
    expect(dropOffHowToPay(bySlug("inverness"), "Inverness Airport")).toBeNull();
  });
  it("pay-later: says you pay after the visit, quotes the airport's wording, links the official page", () => {
    const g = dropOffHowToPay(bySlug("stansted"), "London Stansted")!;
    expect(g.heading).toBe("How to pay the Stansted drop-off charge");
    expect(g.points[0]).toBe("You pay after your visit: by 23:59 the day after your visit.");
    // Stansted's wording is exactly the deadline, so it isn't quoted a second time…
    expect(g.points.join(" ")).not.toContain("The airport's wording");
    expect(g.officialUrl).toBe(bySlug("stansted").sourceUrl);
    // …while Heathrow's adds "(can also pay in advance or on the day)", so it is.
    expect(dropOffHowToPay(bySlug("heathrow"), "Heathrow")!.points).toContain(
      `The airport's wording: ${bySlug("heathrow").paymentDeadline}.`
    );
  });
  it("labels notes as a non-payment penalty only when there is a penalty amount", () => {
    const g = dropOffHowToPay(bySlug("newcastle"), "Newcastle International Airport")!;
    expect(g.points.join(" ")).not.toContain("If you don't pay");
    expect(g.points.at(-1)).toMatch(/^Also note: Red Route/);
  });
  it("pay-on-exit: says you pay as you leave, never 'online' or 'after your visit'", () => {
    const g = dropOffHowToPay(bySlug("newcastle"), "Newcastle International Airport")!;
    expect(g.points[0]).toBe("You pay as you leave the drop-off zone, not afterwards.");
    expect(g.points.join(" ")).not.toMatch(/online|after your visit/i);
  });
  it("only says 'online' when the airport's own wording does", () => {
    for (const r of records.filter((x) => !x.isFree)) {
      const g = dropOffHowToPay(r, nameOf(r.airportSlug));
      if (!g) continue;
      if (/online/i.test(g.points.join(" "))) expect(r.paymentDeadline ?? "", r.airportSlug).toMatch(/online/i);
    }
  });
  it("carries the penalty from the record, and every paid airport gets a guide", () => {
    for (const r of records.filter((x) => !x.isFree)) {
      const g = dropOffHowToPay(r, nameOf(r.airportSlug));
      expect(g, r.airportSlug).not.toBeNull();
      if (r.penaltyPence !== null) expect(g!.points.join(" "), r.airportSlug).toContain(`£${(r.penaltyPence / 100).toFixed(2).replace(/\.00$/, "")}`);
    }
  });
  it("ends every point with a full stop, even when the dataset note doesn't", () => {
    // Newcastle's note reads "Red Route no-stopping zones operate on airport roads" (no full stop).
    expect(dropOffHowToPay(bySlug("newcastle"), "Newcastle International Airport")!.points.at(-1)).toBe(
      "Also note: Red Route no-stopping zones operate on airport roads."
    );
    for (const r of records.filter((x) => !x.isFree)) {
      for (const p of dropOffHowToPay(r, nameOf(r.airportSlug))?.points ?? []) expect(p, `${r.airportSlug}: ${p}`).toMatch(/[.!?]$/);
    }
  });
  it("with no published payment wording, sends readers to the official page rather than guessing", () => {
    const g = dropOffHowToPay(bySlug("glasgow"), "Glasgow Airport")!;
    // About our data, not the airport: a null field doesn't mean the airport publishes nothing.
    expect(g.points[0]).toBe("We haven't recorded how Glasgow Airport takes payment for drop-off. Check the official page before you travel.");
  });
});
