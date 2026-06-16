import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildTimeline } from "../src/timeline";
import { buildShockFeeReel } from "../src/formats/shock-fee";
import type { DropOffRecord, Airport } from "@mathfamily/data";

const airport: Airport = { name: "Stansted", slug: "stansted", iata: "STN", region: "East", lat: 51.88, lng: 0.24 };
const record: DropOffRecord = {
  airportSlug: "stansted", isFree: false, feeSummary: "£7", bands: [{ upToMinutes: 15, totalPence: 700 }],
  maxStayMinutes: 15, perMinuteAfterPence: null, maxChargePence: null, penaltyPence: null, penaltyNotes: null,
  paymentDeadline: null, blueBadgePolicy: "x", freeAlternative: { name: "Mid Stay", minutesFree: 60, details: "x" },
  priorYearFeePence: null, sourceUrl: "https://www.stanstedairport.com/x", verifiedAt: "2026-06-14"
};

describe("reel scenes", () => {
  it("the timed scenes carry the fee, the free alternative and the verified date", () => {
    const script = buildShockFeeReel(record, airport);
    const timed = buildTimeline(script.scenes, 9000);
    const html = renderToStaticMarkup(
      <>{timed.map((s, i) => <p key={i} data-kind={s.kind}>{s.onScreenText}</p>)}</>
    );
    expect(html).toContain("£7 for 15 min");
    expect(html).toContain("Mid Stay");
    expect(html).toContain("Verified 2026-06-14");
  });
});
