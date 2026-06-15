import { describe, expect, it } from "vitest";
import { activeSlotPartnerName, buildAwinLink, buildParkingSearchUrl, composeParkingUed, resolveHeProduct, resolveSlot, validateSearchDates } from "../lib/partners";

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

describe("composeParkingUed", () => {
  const apOff = {
    urlPattern: "https://www.holidayextras.com/{slug}-airport-parking.html",
    slugOverrides: { "londoncity": "london-city" },
    datePrefill: false as boolean,
    dateUrlTemplate: null as string | null,
  };
  const apOn = {
    ...apOff,
    datePrefill: true,
    dateUrlTemplate: "https://he/static/?x#/categories?depart={iata}&out={dropOff}&in={returnDate}",
  };

  it("returns the airport page (no dates) when datePrefill is off", () => {
    const r = composeParkingUed({ ap: apOff, airportSlug: "gatwick", iata: "LGW", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("applies a slug override for the airport page", () => {
    const r = composeParkingUed({ ap: apOff, airportSlug: "londoncity" });
    expect(r.ued).toBe("https://www.holidayextras.com/london-city-airport-parking.html");
  });

  it("uses the dated template (iata + raw ISO dates) when datePrefill is on", () => {
    const r = composeParkingUed({ ap: apOn, airportSlug: "gatwick", iata: "LGW", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r.datePrefilled).toBe(true);
    expect(r.ued).toBe("https://he/static/?x#/categories?depart=LGW&out=2026-12-07&in=2026-12-12");
  });

  it("falls back to the airport page when iata is missing", () => {
    const r = composeParkingUed({ ap: apOn, airportSlug: "gatwick", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("falls back to the airport page when a date is missing", () => {
    const r = composeParkingUed({ ap: apOn, airportSlug: "gatwick", iata: "LGW", dropOff: "2026-12-07" });
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("falls back to the airport page when a date is malformed", () => {
    const r = composeParkingUed({ ap: apOn, airportSlug: "gatwick", iata: "LGW", dropOff: "07/12/2026", returnDate: "2026-12-12" });
    expect(r.datePrefilled).toBe(false);
    expect(r.ued).toBe("https://www.holidayextras.com/gatwick-airport-parking.html");
  });

  it("falls back to the generic landing url when no config is given", () => {
    const r = composeParkingUed({ ap: undefined, airportSlug: "gatwick", fallbackLandingUrl: "https://www.holidayextras.com/airport-parking.html" });
    expect(r.ued).toBe("https://www.holidayextras.com/airport-parking.html");
  });
});

describe("buildParkingSearchUrl", () => {
  it("links to the airport-specific HE page (no dates) with a -search clickref", () => {
    const r = buildParkingSearchUrl({ airportSlug: "gatwick" });
    expect(r).not.toBeNull();
    expect(r!.partnerName).toBe("Holiday Extras");
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("https://www.awin1.com/cread.php?");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("clickref=parkmath-gatwick-search");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
  });

  it("date-prefills the HE search when iata + both dates are given", () => {
    const r = buildParkingSearchUrl({ airportSlug: "manchester", iata: "MAN", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r!.datePrefilled).toBe(true);
    expect(r!.url).toContain("clickref=parkmath-manchester-search");
    // ued is percent-encoded inside the cread link
    expect(r!.url).toContain("depart%3DMAN");
    expect(r!.url).toContain("out%3D2026-12-07");
    expect(r!.url).toContain("in%3D2026-12-12");
  });

  it("stays on the airport page when dates are given but iata is missing", () => {
    const r = buildParkingSearchUrl({ airportSlug: "manchester", dropOff: "2026-12-07", returnDate: "2026-12-12" });
    expect(r!.datePrefilled).toBe(false);
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fmanchester-airport-parking.html");
  });
});

describe("validateSearchDates", () => {
  const today = "2026-06-15";
  it("returns null for a valid future range", () => {
    expect(validateSearchDates("2026-12-07", "2026-12-12", today)).toBeNull();
  });
  it("allows a drop-off today", () => {
    expect(validateSearchDates("2026-06-15", "2026-12-12", today)).toBeNull();
  });
  it("requires both dates", () => {
    expect(validateSearchDates("", "2026-12-12", today)).toBe("Pick both dates");
    expect(validateSearchDates("2026-12-07", "", today)).toBe("Pick both dates");
  });
  it("rejects a drop-off in the past", () => {
    expect(validateSearchDates("2026-06-14", "2026-12-12", today)).toBe("Drop-off can't be in the past");
  });
  it("rejects a return on or before drop-off", () => {
    expect(validateSearchDates("2026-12-12", "2026-12-07", today)).toBe("Return must be after drop-off");
    expect(validateSearchDates("2026-12-12", "2026-12-12", today)).toBe("Return must be after drop-off");
  });
});
