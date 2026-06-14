import { describe, it, expect } from "vitest";
import { roamingCsv, baggageCsv } from "../lib/open-data";

describe("roamingCsv", () => {
  const { header, rows } = roamingCsv();
  it("has the expected header", () => {
    expect(header).toEqual(["country","iso2","network","included","daily_pass_gbp","pass_name","verified_at","source_url"]);
  });
  it("emits one row per destination x 4 networks with GBP-formatted pass prices", () => {
    expect(rows.length % 4).toBe(0);
    for (const r of rows) {
      expect(r.length).toBe(header.length);
      expect(["yes","no"]).toContain(r[3]);
      if (r[4] !== "") expect(r[4]).toMatch(/^\d+\.\d{2}$/);
    }
  });
});

describe("baggageCsv", () => {
  const { header, rows } = baggageCsv();
  it("has the expected header", () => {
    expect(header).toEqual(["airline","item","min_gbp","max_gbp","note","verified_at","source_url"]);
  });
  it("emits one row per airline x fee with GBP min/max or blank", () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.length).toBe(header.length);
      if (r[2] !== "") expect(r[2]).toMatch(/^\d+\.\d{2}$/);
      if (r[3] !== "") expect(r[3]).toMatch(/^\d+\.\d{2}$/);
    }
  });
});
