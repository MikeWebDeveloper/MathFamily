import { describe, expect, it } from "vitest";
import { activeSlotPartnerName, buildAwinLink, buildParkingSearchUrl, composeParkingUed, formatHeDate, resolveHeProduct, resolveSlot } from "../lib/partners";

describe("buildAwinLink", () => {
  it("builds a bare cread.php link with clickref and no ued", () => {
    expect(buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick" })).toBe(
      "https://www.awin1.com/cread.php?awinmid=3496&awinaffid=2932035&clickref=parkmath-gatwick"
    );
  });
  it("appends a clickref suffix when given", () => {
    const url = buildAwinLink({ awinmid: "3496", publisherId: "2932035", airportSlug: "gatwick", clickrefSuffix: "dropoff" });
    expect(url).toContain("clickref=parkmath-gatwick-dropoff");
  });
  it("percent-encodes a ued destination so its own query string cannot leak", () => {
    const url = buildAwinLink({
      awinmid: "3496",
      publisherId: "2932035",
      airportSlug: "gatwick",
      ued: "https://shop.example.com/p?a=1&b=2",
    });
    expect(url).toContain("ued=https%3A%2F%2Fshop.example.com%2Fp%3Fa%3D1%26b%3D2");
    expect(url.split("&")).toHaveLength(4); // awinmid, awinaffid, clickref, ued — destination's & is encoded
  });
});

describe("resolveSlot", () => {
  it("parking-prebook resolves to the active Holiday Extras affiliate link", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("affiliate");
    expect(r.partnerName).toBe("Holiday Extras");
    expect(r.disclosureRequired).toBe(true);
    expect(r.url).toContain("awinmid=3496");
    expect(r.url).toContain("awinaffid=2932035");
    expect(r.url).toContain("clickref=parkmath-gatwick");
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
  });
  it("lounge-membership stays official while inactive", () => {
    const r = resolveSlot("lounge-membership", "gatwick", "https://www.prioritypass.com");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.prioritypass.com");
    expect(r.disclosureRequired).toBe(false);
  });
});

describe("resolveHeProduct", () => {
  it("builds an HE lounge deep link with a surface clickref", () => {
    const r = resolveHeProduct("lounge", "gatwick", "lounge");
    expect(r).not.toBeNull();
    expect(r!.productLabel).toBe("lounge");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("clickref=parkmath-gatwick-lounge");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
  });
});

describe("activeSlotPartnerName", () => {
  it("returns the active parking partner's name", () => {
    expect(activeSlotPartnerName("parking-prebook")).toBe("Holiday Extras");
  });
  it("returns null for an inactive slot", () => {
    expect(activeSlotPartnerName("lounge-membership")).toBeNull();
  });
});

describe("formatHeDate", () => {
  it("converts an ISO date to HE's DD/MM/YY format", () => {
    expect(formatHeDate("2026-12-07")).toBe("07/12/26");
    expect(formatHeDate("2026-01-31")).toBe("31/01/26");
  });
});

describe("composeParkingUed", () => {
  const ap = {
    urlPattern: "https://www.holidayextras.com/{slug}-airport-parking.html",
    slugOverrides: { "london-city": "london-city-airport" },
    datePrefill: false as boolean,
    dateUrlTemplate: null as string | null,
  };

  it("returns the airport page (no dates) when datePrefill is off", () => {
    const r = composeParkingUed(ap, "gatwick", "2026-12-07", "2026-12-12");
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("applies a slug override", () => {
    const r = composeParkingUed(ap, "london-city");
    expect(r.ued).toBe("https://www.holidayextras.com/london-city-airport-airport-parking.html");
  });

  it("uses the dated template when datePrefill is on and both dates are present", () => {
    const dated = { ...ap, datePrefill: true, dateUrlTemplate: "https://www.holidayextras.com/quote?dest={slug}&ArrivalDate={dropOff}&DepartDate={returnDate}" };
    const r = composeParkingUed(dated, "gatwick", "2026-12-07", "2026-12-12");
    expect(r.datePrefilled).toBe(true);
    expect(r.ued).toBe("https://www.holidayextras.com/quote?dest=gatwick&ArrivalDate=07/12/26&DepartDate=12/12/26");
  });

  it("falls back to the airport page when datePrefill is on but a date is missing", () => {
    const dated = { ...ap, datePrefill: true, dateUrlTemplate: "https://x/{slug}?a={dropOff}&b={returnDate}" };
    const r = composeParkingUed(dated, "gatwick", "2026-12-07", undefined);
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("falls back to the generic landing url when no config is given", () => {
    const r = composeParkingUed(undefined, "gatwick", undefined, undefined, "https://www.holidayextras.com/airport-parking.html");
    expect(r.ued).toBe("https://www.holidayextras.com/airport-parking.html");
  });
});

describe("buildParkingSearchUrl", () => {
  it("builds a tracked link to the airport-specific HE page with a -search clickref", () => {
    const r = buildParkingSearchUrl({ airportSlug: "gatwick" });
    expect(r).not.toBeNull();
    expect(r!.partnerName).toBe("Holiday Extras");
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("https://www.awin1.com/cread.php?");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("awinaffid=2932035");
    expect(r!.url).toContain("clickref=parkmath-gatwick-search");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
  });

  it("stays on the airport page (no dates) while datePrefill is off, even if dates are passed", () => {
    const r = buildParkingSearchUrl({ airportSlug: "manchester", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fmanchester-airport-parking.html");
  });
});
