import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadDropOffDataset, loadParkingDataset } from "@mathfamily/data";
import OptionsPage from "../app/airport-parking-options/[airport]/page";
import OptionsHub from "../app/airport-parking-options/page";
import BlueBadgePage from "../app/blue-badge/[airport]/page";
import AvoidPage from "../app/avoid-drop-off-charge/[airport]/page";
import { STRIKING_DISTANCE_OPTIONS_SLUGS, strikingDistanceOptions } from "../lib/options-content";

type Page = (props: { params: Promise<{ airport: string }> }) => Promise<React.JSX.Element>;
const render = async (P: unknown, airport: string) => renderToStaticMarkup(await (P as Page)({ params: Promise.resolve({ airport }) }));
const dropOff = (slug: string) => loadDropOffDataset().records.find((r) => r.airportSlug === slug)!;
const parking = (slug: string) => loadParkingDataset().records.find((r) => r.airportSlug === slug) ?? null;

describe("strikingDistanceOptions (Exeter, Norwich, Prestwick, Leeds Bradford)", () => {
  it("is limited to the four airports GSC shows near page 1 and fails closed for everyone else", () => {
    expect([...STRIKING_DISTANCE_OPTIONS_SLUGS].sort()).toEqual(["exeter", "leeds-bradford", "norwich", "prestwick"]);
    expect(strikingDistanceOptions("stansted", dropOff("stansted"), parking("stansted"), "Stansted")).toBeNull();
  });

  it("exeter: H1 names parking AND drop-off; intro states the verified fee, the free option and the gate rate", () => {
    const s = strikingDistanceOptions("exeter", dropOff("exeter"), parking("exeter"), "Exeter")!;
    expect(s.heading).toBe("Exeter Airport parking & drop-off: which is cheaper?");
    expect(s.intro).toContain("£8 for up to 15 min");
    expect(s.intro).toMatch(/drop-off and pick-up/);
    expect(s.intro).toContain("Car Park P4 free drop-off");
    expect(s.intro).toContain("£280 for 7 days");
    expect(s.intro).toMatch(/pre-booking online is usually cheaper/i);
  });

  it("norwich has no verified gate tariff: no parking price is stated or invented", () => {
    const s = strikingDistanceOptions("norwich", dropOff("norwich"), parking("norwich"), "Norwich")!;
    expect(s.intro).toContain("£8 for up to 20 min");
    expect(s.intro).not.toMatch(/for 7 days/);
    const q = s.extraFaqs.find((f) => /how much is parking/i.test(f.question))!;
    expect(q.answer).toMatch(/haven't verified/i);
    expect(q.answer).not.toMatch(/£\d+ for \d+ days/);
  });

  it("parking FAQ quotes only official gate figures for the durations the tariff publishes", () => {
    const s = strikingDistanceOptions("prestwick", dropOff("prestwick"), parking("prestwick"), "Glasgow Prestwick")!;
    const q = s.extraFaqs.find((f) => /how much is parking/i.test(f.question))!;
    expect(q.answer).toContain("£103.50 for 7 days");
    expect(q.answer).toContain("£66.50 for 3 days");
    expect(q.answer).toContain("£160 for 14 days");
    expect(q.answer).toMatch(/Verified 2026-\d\d-\d\d/);
  });

  it("adds a pick-up FAQ only where the airport's verified fee text says the area is for drop-off AND pick-up", () => {
    for (const slug of STRIKING_DISTANCE_OPTIONS_SLUGS) {
      const s = strikingDistanceOptions(slug, dropOff(slug), parking(slug), slug)!;
      expect(s.extraFaqs.some((f) => /pick/i.test(f.question)), slug).toBe(/pick[- ]?up/i.test(dropOff(slug).feeSummary));
    }
  });
});

describe("/airport-parking-options/[airport] for the striking-distance airports", () => {
  it("exeter renders the clearer H1, the intro and the added FAQ; stansted is untouched", async () => {
    const exeter = await render(OptionsPage, "exeter");
    expect(exeter).toMatch(/<h1[^>]*>Exeter Airport parking &amp; drop-off: which is cheaper\?<\/h1>/);
    expect(exeter).toContain("£280 for 7 days");
    expect(exeter).toContain("How much is parking at");
    const stansted = await render(OptionsPage, "stansted");
    expect(stansted).toMatch(/<h1[^>]*>Is it cheaper to park or get dropped off at Stansted Airport\?<\/h1>/);
    expect(stansted).not.toContain("How much is parking at");
  });
});

describe("internal links into the options pages", () => {
  it("blue-badge and avoid pages link to their airport's options page", async () => {
    for (const slug of ["exeter", "norwich", "prestwick", "leeds-bradford"]) {
      expect(await render(BlueBadgePage, slug), `blue-badge/${slug}`).toContain(`href="/airport-parking-options/${slug}"`);
    }
    // Only airports with a verified free alternative have an avoid page (not Norwich or Prestwick).
    for (const slug of ["exeter", "leeds-bradford"]) {
      expect(await render(AvoidPage, slug), `avoid/${slug}`).toContain(`href="/airport-parking-options/${slug}"`);
    }
  });

  it("the options hub features all four in its most-searched strip", () => {
    const html = renderToStaticMarkup(<OptionsHub />);
    const strip = html.slice(html.indexOf("Most-searched airport parking options"), html.indexOf("Pick your airport"));
    for (const slug of ["exeter", "norwich", "prestwick", "leeds-bradford"]) {
      expect(strip, slug).toContain(`href="/airport-parking-options/${slug}"`);
    }
  });
});
