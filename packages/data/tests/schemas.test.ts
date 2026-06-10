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

describe("AirportSchema", () => {
  it("accepts a valid airport", () => {
    expect(() => AirportSchema.parse({ name: "London Gatwick", slug: "gatwick", iata: "LGW", region: "London" })).not.toThrow();
  });
  it("rejects an invalid slug", () => {
    expect(() => AirportSchema.parse({ name: "X", slug: "Bad Slug!", iata: "LGW", region: "London" })).toThrow();
  });
  // Issue 3: IATA must be 3 uppercase letters
  it("rejects a lowercase IATA code", () => {
    expect(() => AirportSchema.parse({ name: "London Gatwick", slug: "gatwick", iata: "lgw", region: "London" })).toThrow();
  });
  // Issue 4: slug must not have leading/trailing/double dashes
  it("rejects a trailing-dash slug", () => {
    expect(() => AirportSchema.parse({ name: "London Gatwick", slug: "gat-", iata: "LGW", region: "London" })).toThrow();
  });
  // Issue 2: strict object rejects unknown fields
  it("rejects an airport with an unknown field", () => {
    expect(() => AirportSchema.parse({ name: "London Gatwick", slug: "gatwick", iata: "LGW", region: "London", extraField: "oops" })).toThrow();
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
});
