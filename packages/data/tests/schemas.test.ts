import { describe, expect, it } from "vitest";
import { AirportSchema, DropOffRecordSchema } from "../src/schemas";

const validRecord = {
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
  blueBadgePolicy: "Exempt if registered with the airport in advance",
  freeAlternative: { name: "Long Stay car park", minutesFree: 30, details: "Free for 30 minutes, then shuttle to terminal" },
  priorYearFeePence: 700,
  sourceUrl: "https://www.gatwickairport.com/drop-off",
  verifiedAt: "2026-06-10"
};

const validAirport = { name: "London Gatwick", slug: "gatwick", iata: "LGW", region: "London", lat: 51.1537, lng: -0.1821 };

describe("AirportSchema", () => {
  it("accepts a valid airport", () => {
    expect(() => AirportSchema.parse(validAirport)).not.toThrow();
  });
  it("rejects an invalid slug", () => {
    expect(() => AirportSchema.parse({ ...validAirport, slug: "Bad Slug!" })).toThrow();
  });
  // Issue 3: IATA must be 3 uppercase letters
  it("rejects a lowercase IATA code", () => {
    expect(() => AirportSchema.parse({ ...validAirport, iata: "lgw" })).toThrow();
  });
  // Issue 4: slug must not have leading/trailing/double dashes
  it("rejects a trailing-dash slug", () => {
    expect(() => AirportSchema.parse({ ...validAirport, slug: "gat-" })).toThrow();
  });
  // Issue 2: strict object rejects unknown fields
  it("rejects an airport with an unknown field", () => {
    expect(() => AirportSchema.parse({ ...validAirport, extraField: "oops" })).toThrow();
  });
});

describe("DropOffRecordSchema", () => {
  it("accepts a valid record", () => {
    expect(() => DropOffRecordSchema.parse(validRecord)).not.toThrow();
  });
  it("rejects a record without sourceUrl", () => {
    const { sourceUrl: _omitted, ...rest } = validRecord;
    expect(() => DropOffRecordSchema.parse(rest)).toThrow();
  });
  it("rejects a bad verifiedAt date format", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, verifiedAt: "10/06/2026" })).toThrow();
  });
  it("rejects a non-free airport with no tariff bands", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, bands: [] })).toThrow();
  });
  it("accepts a free airport with no bands", () => {
    expect(() =>
      DropOffRecordSchema.parse({ ...validRecord, isFree: true, bands: [], feeSummary: "Free at the forecourt" })
    ).not.toThrow();
  });
  // Issue 1: IsoDate must reject impossible calendar dates
  it("rejects an impossible calendar date (2026-13-45)", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, verifiedAt: "2026-13-45" })).toThrow();
  });
  it("accepts a real calendar date (2026-06-10)", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, verifiedAt: "2026-06-10" })).not.toThrow();
  });
  // Issue 2: strict object rejects unknown/typo'd fields
  it("rejects a record with an unknown field (pentaltyPence typo)", () => {
    expect(() => DropOffRecordSchema.parse({ ...validRecord, pentaltyPence: 5000 })).toThrow();
  });

  // Public-transport free alternative: minutesFree must be null, kind set.
  it("accepts a public-transport free alternative with null minutesFree", () => {
    expect(() =>
      DropOffRecordSchema.parse({
        ...validRecord,
        freeAlternative: { name: "DLR", kind: "public-transport", minutesFree: null, details: "Train to the terminal." }
      })
    ).not.toThrow();
  });
  it("rejects a public-transport free alternative that fabricates minutesFree", () => {
    expect(() =>
      DropOffRecordSchema.parse({
        ...validRecord,
        freeAlternative: { name: "DLR", kind: "public-transport", minutesFree: 30, details: "Train to the terminal." }
      })
    ).toThrow();
  });
  it("rejects a car-park free alternative with null minutesFree", () => {
    expect(() =>
      DropOffRecordSchema.parse({
        ...validRecord,
        freeAlternative: { name: "Long Stay", kind: "car-park", minutesFree: null, details: "Free for a bit." }
      })
    ).toThrow();
  });
  it("accepts a legacy car-park free alternative with no kind field", () => {
    expect(() =>
      DropOffRecordSchema.parse({
        ...validRecord,
        freeAlternative: { name: "Long Stay", minutesFree: 30, details: "Free for 30 min." }
      })
    ).not.toThrow();
  });
});
