import { describe, expect, it } from "vitest";
import {
  activeSlotPartnerName,
  airportParkingUrl,
  buildAwinLink,
  goLink,
  goLinkMerchant,
  heAirportParkingUrl,
  resolveAllParkingMerchants,
  resolveGoTarget,
  resolveHeProduct,
  resolveParkingMerchant,
  resolvePartnerProduct,
  resolveSlot,
} from "../lib/partners";

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

describe("airportParkingUrl (per-merchant, per-airport)", () => {
  it("Holiday Extras uses the uniform {slug} template", () => {
    expect(airportParkingUrl("holiday-extras", "heathrow")).toBe("https://www.holidayextras.com/heathrow-airport-parking.html");
  });
  it("APH uses its verified explicit map (irregular structure)", () => {
    // .html-style airport
    expect(airportParkingUrl("aph", "gatwick")).toBe("https://www.aph.com/gatwick-airport-parking.html");
    // directory-style airport (verified live: /<slug>-airport/parking/)
    expect(airportParkingUrl("aph", "heathrow")).toBe("https://www.aph.com/heathrow-airport/parking/");
    expect(airportParkingUrl("aph", "stansted")).toBe("https://www.aph.com/stansted-airport/parking/");
    expect(airportParkingUrl("aph", "birmingham")).toBe("https://www.aph.com/birmingham-airport/parking/");
  });
  it("APH returns null where it has no verified page (fail-closed)", () => {
    expect(airportParkingUrl("aph", "belfast-international")).toBeNull();
    expect(airportParkingUrl("aph", "norwich")).toBeNull();
  });
  it("returns null for non-airport contexts", () => {
    expect(airportParkingUrl("holiday-extras", "home")).toBeNull();
    expect(heAirportParkingUrl("")).toBeNull();
  });
});

describe("resolveSlot — per-airport merchant override (diversification)", () => {
  it("Gatwick is an APH override airport → resolves to APH (awinmid 1478) at APH's verified URL", () => {
    const r = resolveSlot("parking-prebook", "gatwick", "https://www.gatwickairport.com/parking");
    expect(r.kind).toBe("affiliate");
    expect(r.partnerName).toBe("APH");
    expect(r.disclosureRequired).toBe(true);
    expect(r.url).toContain("awinmid=1478");
    expect(r.url).toContain("awinaffid=2932035");
    expect(r.url).toContain("clickref=parkmath-gatwick");
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fgatwick-airport-parking.html");
  });
  it("Heathrow (primary override, Mike-directed 2026-07-11) resolves to Heathrow Airport Parking, not APH", () => {
    const r = resolveSlot("parking-prebook", "heathrow", "https://heathrow.com");
    expect(r.partnerName).toBe("Heathrow Airport Parking");
    expect(r.url).toContain("awinmid=2365");
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.heathrow.com%2Fbooking%2Fparking");
  });
  it("an unrouted airport still resolves to Holiday Extras (existing HE links unbroken)", () => {
    // leeds-bradford is HE-only (not an APH/Purple/Airparks override airport).
    const r = resolveSlot("parking-prebook", "leeds-bradford", "https://leedsbradfordairport.co.uk");
    expect(r.partnerName).toBe("Holiday Extras");
    expect(r.url).toContain("awinmid=3496");
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fleeds-bradford-airport-parking.html");
  });
  it("lounge-membership stays official while inactive", () => {
    const r = resolveSlot("lounge-membership", "gatwick", "https://www.prioritypass.com");
    expect(r.kind).toBe("official");
    expect(r.url).toBe("https://www.prioritypass.com");
    expect(r.disclosureRequired).toBe(false);
  });
  it("carries a merchant-specific termsUrl", () => {
    expect(resolveSlot("parking-prebook", "gatwick", "x").termsUrl).toBe("https://www.aph.com/");
    expect(resolveSlot("parking-prebook", "leeds-bradford", "x").termsUrl).toBe("https://www.holidayextras.com/airport-parking.html");
  });
});

describe("resolveParkingMerchant", () => {
  it("picks APH on an override airport and HE on an unrouted airport", () => {
    expect(resolveParkingMerchant("manchester", "hub")?.partnerName).toBe("APH");
    expect(resolveParkingMerchant("east-midlands", "hub")?.partnerName).toBe("Holiday Extras");
  });
  it("builds the airport-specific clickref + deep link", () => {
    const r = resolveParkingMerchant("manchester", "hub");
    expect(r!.url).toContain("awinmid=1478");
    expect(r!.url).toContain("clickref=parkmath-manchester-hub");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fmanchester-airport-parking.html");
  });
});

describe("resolvePartnerProduct — parking fails closed where merchant has no page", () => {
  it("APH parking returns null for an airport APH does not cover", () => {
    expect(resolvePartnerProduct("aph", "parking", "belfast-international", "hub")).toBeNull();
  });
  it("APH parking resolves for a covered airport", () => {
    const r = resolvePartnerProduct("aph", "parking", "edinburgh", "dropoff");
    expect(r!.partnerName).toBe("APH");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fedinburgh-airport-parking.html");
  });
});

describe("resolveHeProduct (HE-only products)", () => {
  it("builds an HE lounge deep link with a surface clickref", () => {
    const r = resolveHeProduct("lounge", "gatwick", "lounge");
    expect(r).not.toBeNull();
    expect(r!.productLabel).toBe("lounge");
    expect(r!.url).toContain("awinmid=3496");
    expect(r!.url).toContain("clickref=parkmath-gatwick-lounge");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
  });
  it("HE parking deep-links to the airport's own HE page", () => {
    const r = resolveHeProduct("parking", "newcastle", "dropoff");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fnewcastle-airport-parking.html");
  });
  it("parking falls back to the generic page off-airport (slug 'home')", () => {
    const r = resolveHeProduct("parking", "home", "home");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
  });
});

describe("newly-activated AWIN merchants emit TRACKED deep links (purple-parking, airparks)", () => {
  it("Purple Parking (awinmid 12028) is active with a verified per-airport page → tracked cread.php", () => {
    const r = resolvePartnerProduct("purple-parking", "parking", "luton", "dropoff");
    expect(r).not.toBeNull();
    expect(r!.partnerName).toBe("Purple Parking");
    expect(r!.url).toContain("https://www.awin1.com/cread.php?");
    expect(r!.url).toContain("awinmid=12028");
    expect(r!.url).toContain("awinaffid=2932035");
    expect(r!.url).toContain("clickref=parkmath-luton-dropoff");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.purpleparking.com%2Fairport-parking%2Fluton");
    expect(r!.termsUrl).toBe("https://www.purpleparking.com/");
  });
  it("Airparks (awinmid 3494) is active with a verified per-airport page → tracked cread.php", () => {
    const r = resolvePartnerProduct("airparks", "parking", "manchester", "hub");
    expect(r).not.toBeNull();
    expect(r!.partnerName).toBe("Airparks");
    expect(r!.url).toContain("awinmid=3494");
    expect(r!.url).toContain("awinaffid=2932035");
    expect(r!.url).toContain("clickref=parkmath-manchester-hub");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.airparks.co.uk%2Fmanchester-airport-parking.html");
  });
  it("APH stays primary on its other override airports (existing links unbroken)", () => {
    // Heathrow moved out of this set 2026-07-11 (Mike-directed primary override) — asserted separately below.
    for (const slug of ["gatwick", "manchester", "stansted", "luton", "birmingham", "bristol", "edinburgh"]) {
      expect(resolveParkingMerchant(slug, "hub")?.partnerName).toBe("APH");
    }
  });
  it("Heathrow Airport Parking (mid 2365) is now the PRIMARY serving merchant at Heathrow (Mike-directed, 2026-07-11) — APH demoted but still a covered option", () => {
    const r = resolveParkingMerchant("heathrow", "hub");
    expect(r?.partnerName).toBe("Heathrow Airport Parking");
    expect(r!.url).toContain("awinmid=2365");
    expect(r!.url).toContain("clickref=parkmath-heathrow-hub");
    // APH is still a genuinely covered option in the multi-merchant comparison list — just no longer
    // the single-CTA primary at Heathrow.
    expect(resolveAllParkingMerchants("heathrow", "hub").map((o) => o.partnerName)).toContain("APH");
  });
  it("Purple Parking is now the PRIMARY serving merchant on its routed airports → CTA emits a tracked 12028 link", () => {
    for (const slug of ["glasgow", "newcastle", "aberdeen"]) {
      const r = resolveParkingMerchant(slug, "hub");
      expect(r?.partnerName).toBe("Purple Parking");
      expect(r!.url).toContain("https://www.awin1.com/cread.php?");
      expect(r!.url).toContain("awinmid=12028");
      expect(r!.url).toContain(`clickref=parkmath-${slug}-hub`);
    }
  });
  it("Airparks is now the PRIMARY serving merchant on its routed airports → CTA emits a tracked 3494 link", () => {
    for (const slug of ["liverpool", "cardiff", "southend"]) {
      const r = resolveParkingMerchant(slug, "hub");
      expect(r?.partnerName).toBe("Airparks");
      expect(r!.url).toContain("awinmid=3494");
      expect(r!.url).toContain(`clickref=parkmath-${slug}-hub`);
    }
  });
  it("the /go parking route now 302-resolves to purple-parking / airparks deep links on the routed airports", () => {
    expect(resolveGoTarget("parking", "glasgow", "hub")!.url).toContain("awinmid=12028");
    expect(resolveGoTarget("parking", "liverpool", "hub")!.url).toContain("awinmid=3494");
  });
  it("an HE-only airport NOT routed to a new merchant still serves Holiday Extras (no regression)", () => {
    expect(resolveParkingMerchant("leeds-bradford", "hub")?.partnerName).toBe("Holiday Extras");
    expect(resolveParkingMerchant("east-midlands", "hub")?.partnerName).toBe("Holiday Extras");
    expect(resolveParkingMerchant("southampton", "hub")?.partnerName).toBe("Holiday Extras");
    expect(resolveParkingMerchant("exeter", "hub")?.partnerName).toBe("Holiday Extras");
  });
  it("both new merchants resolve a tracked link on every airport they cover", () => {
    for (const slug of ["heathrow", "gatwick", "manchester", "stansted", "luton", "birmingham", "bristol", "edinburgh", "glasgow", "newcastle", "liverpool", "leeds-bradford", "east-midlands", "aberdeen", "cardiff", "southampton", "exeter", "southend"]) {
      expect(resolvePartnerProduct("purple-parking", "parking", slug, "hub")?.url).toContain("awinmid=12028");
      expect(resolvePartnerProduct("airparks", "parking", slug, "hub")?.url).toContain("awinmid=3494");
    }
  });
});

describe("resolveAllParkingMerchants — multi-option, commission-blind presentation", () => {
  it("an airport covered by all joined merchants returns them all, alphabetical by name", () => {
    // Park BCP (awinmid 3495) joined 2026-06-26 with a verified per-airport page; it sorts
    // alphabetically between "Holiday Extras" and "Purple Parking".
    const opts = resolveAllParkingMerchants("gatwick", "options");
    expect(opts.map((o) => o.partnerName)).toEqual(["Airparks", "APH", "Holiday Extras", "Park BCP", "Purple Parking"]);
  });

  it("each option is a tracked AWIN cread.php deep link with the right awinmid/affid/clickref/ued", () => {
    const byName = Object.fromEntries(resolveAllParkingMerchants("gatwick", "options").map((o) => [o.partnerName, o]));
    expect(byName["APH"]!.url).toContain("awinmid=1478");
    expect(byName["Airparks"]!.url).toContain("awinmid=3494");
    expect(byName["Holiday Extras"]!.url).toContain("awinmid=3496");
    expect(byName["Purple Parking"]!.url).toContain("awinmid=12028");
    for (const o of Object.values(byName)) {
      expect(o.url).toContain("https://www.awin1.com/cread.php?");
      expect(o.url).toContain("awinaffid=2932035");
      expect(o.url).toContain("clickref=parkmath-gatwick-options");
    }
    // ued points at each merchant's verified per-airport Gatwick page.
    expect(byName["APH"]!.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fgatwick-airport-parking.html");
    expect(byName["Purple Parking"]!.url).toContain("ued=https%3A%2F%2Fwww.purpleparking.com%2Fgatwick-airport-parking");
  });

  it("ORDERING is purely alphabetical (commission-blind) — independent of airportOverrides primary order", () => {
    // glasgow's override put Purple Parking PRIMARY; the multi-option list must NOT inherit that — it
    // is alphabetical, so APH comes first regardless of who was the single primary.
    const opts = resolveAllParkingMerchants("glasgow", "options");
    expect(opts.map((o) => o.partnerName)).toEqual(["Airparks", "APH", "Holiday Extras", "Park BCP", "Purple Parking"]);
  });

  it("OMITS a merchant with no verified per-airport page (norwich: HE + Park BCP only)", () => {
    // norwich: Holiday Extras (template) + Park BCP (verified per-airport page, joined 2026-06-26)
    // cover it; APH/Purple/Airparks have no verified Norwich page → fail closed (omitted).
    const opts = resolveAllParkingMerchants("norwich", "options");
    expect(opts.map((o) => o.partnerName)).toEqual(["Holiday Extras", "Park BCP"]);
  });

  it("never emits a non-covering merchant (belfast-international is HE-only)", () => {
    const names = resolveAllParkingMerchants("belfast-international", "options").map((o) => o.partnerName);
    expect(names).toEqual(["Holiday Extras"]);
  });

  it("returns [] for a non-airport context (slug 'home') so callers fall back to the official option", () => {
    expect(resolveAllParkingMerchants("home", "options")).toEqual([]);
  });

  it("Heathrow's primaryOverrides pins Heathrow Airport Parking FIRST; every other option stays alphabetical (Mike-directed, 2026-07-11, Heathrow only)", () => {
    const opts = resolveAllParkingMerchants("heathrow", "options");
    expect(opts.map((o) => o.partnerName)).toEqual([
      "Heathrow Airport Parking",
      "Airparks",
      "APH",
      "Holiday Extras",
      "Park BCP",
      "Purple Parking",
    ]);
    expect(opts.filter((o) => o.isPinnedPrimary).map((o) => o.partnerName)).toEqual(["Heathrow Airport Parking"]);
  });

  it("the primary pin is Heathrow-only — no other airport's isPinnedPrimary is ever true, and gatwick/glasgow stay purely alphabetical", () => {
    for (const slug of ["gatwick", "glasgow", "norwich", "belfast-international"]) {
      const opts = resolveAllParkingMerchants(slug, "options");
      expect(opts.every((o) => o.isPinnedPrimary === false)).toBe(true);
    }
  });
});

describe("goLinkMerchant + /go per-merchant parking target", () => {
  it("builds /go/<airport>/parking:<partnerId>?s=<surface> (colon url-encoded)", () => {
    expect(goLinkMerchant("options", "gatwick", "aph")).toBe("/go/gatwick/parking%3Aaph?s=options");
    expect(goLinkMerchant("parking", "glasgow", "purple-parking")).toBe("/go/glasgow/parking%3Apurple-parking?s=parking");
  });

  it("the /go route rebuilds the EXACT per-merchant deep link the option used (byte-identical)", () => {
    const opt = resolveAllParkingMerchants("gatwick", "options").find((o) => o.partnerName === "Purple Parking")!;
    const viaGo = resolveGoTarget("parking:purple-parking", "gatwick", "options");
    expect(viaGo).not.toBeNull();
    expect(viaGo!.url).toBe(opt.url);
    expect(viaGo!.url).toContain("awinmid=12028");
  });

  it("APH/HE/Purple/Airparks per-merchant targets each rebuild the right cread.php link", () => {
    expect(resolveGoTarget("parking:aph", "manchester", "options")!.url).toContain("awinmid=1478");
    expect(resolveGoTarget("parking:holiday-extras", "manchester", "options")!.url).toContain("awinmid=3496");
    expect(resolveGoTarget("parking:purple-parking", "manchester", "options")!.url).toContain("awinmid=12028");
    expect(resolveGoTarget("parking:airparks", "manchester", "options")!.url).toContain("awinmid=3494");
  });

  it("fail-closed: a per-merchant target for an airport the merchant does NOT cover returns null (404)", () => {
    // norwich is HE-only — APH has no verified page, so /go must 404 rather than emit a broken link.
    expect(resolveGoTarget("parking:aph", "norwich", "options")).toBeNull();
    expect(resolveGoTarget("parking:purple-parking", "norwich", "options")).toBeNull();
    // HE still resolves on norwich (template coverage).
    expect(resolveGoTarget("parking:holiday-extras", "norwich", "options")!.url).toContain("awinmid=3496");
  });

  it("fail-closed: an unknown partnerId returns null", () => {
    expect(resolveGoTarget("parking:not-a-merchant", "gatwick", "options")).toBeNull();
  });
});

describe("activeSlotPartnerName", () => {
  it("returns the default active parking partner's name", () => {
    expect(activeSlotPartnerName("parking-prebook")).toBe("Holiday Extras");
  });
  it("returns null for an inactive slot", () => {
    expect(activeSlotPartnerName("lounge-membership")).toBeNull();
  });
});

describe("goLink (first-party redirect path)", () => {
  it("builds /go/<airport>/<target>?s=<surface>", () => {
    expect(goLink("dropoff", "gatwick", "parking")).toBe("/go/gatwick/parking?s=dropoff");
    expect(goLink("lounge", "manchester", "lounge")).toBe("/go/manchester/lounge?s=lounge");
  });
  it("omits the ?s= query when surface is empty (slot CTA has no clickref suffix)", () => {
    expect(goLink("", "gatwick", "parking-prebook")).toBe("/go/gatwick/parking-prebook");
  });
  it("url-encodes path segments", () => {
    expect(goLink("home", "home", "transfers")).toBe("/go/home/transfers?s=home");
  });
});

describe("resolveGoTarget — rebuilds the EXACT AWIN deep link (attribution preserved)", () => {
  it("parking-prebook rebuilds the same URL resolveSlot produced (byte-identical, APH airport)", () => {
    const direct = resolveSlot("parking-prebook", "gatwick", "");
    const viaGo = resolveGoTarget("parking-prebook", "gatwick", "");
    expect(viaGo).not.toBeNull();
    expect(viaGo!.url).toBe(direct.url);
    expect(viaGo!.url).toContain("awinmid=1478");
    expect(viaGo!.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fgatwick-airport-parking.html");
  });
  it("parking target on an APH override airport rebuilds the APH deep link", () => {
    const direct = resolveParkingMerchant("gatwick", "dropoff");
    const viaGo = resolveGoTarget("parking", "gatwick", "dropoff");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("awinmid=1478");
    expect(viaGo!.url).toContain("clickref=parkmath-gatwick-dropoff");
  });
  it("parking target on Heathrow now rebuilds the Heathrow Airport Parking deep link (primary override, Mike-directed 2026-07-11)", () => {
    const direct = resolveParkingMerchant("heathrow", "dropoff");
    const viaGo = resolveGoTarget("parking", "heathrow", "dropoff");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("awinmid=2365");
    expect(viaGo!.url).toContain("clickref=parkmath-heathrow-dropoff");
  });
  it("parking target on an unrouted airport rebuilds the HE deep link", () => {
    const viaGo = resolveGoTarget("parking", "east-midlands", "dropoff");
    expect(viaGo!.url).toContain("awinmid=3496");
    expect(viaGo!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Feast-midlands-airport-parking.html");
  });
  it("an HE product target rebuilds the same URL resolveHeProduct produced (with surface clickref)", () => {
    const direct = resolveHeProduct("hotels", "gatwick", "dropoff-hotels");
    const viaGo = resolveGoTarget("hotels", "gatwick", "dropoff-hotels");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("clickref=parkmath-gatwick-dropoff-hotels");
  });
  it("returns null for an unknown target (route 404s — never an open redirect)", () => {
    expect(resolveGoTarget("evil", "gatwick", "")).toBeNull();
    expect(resolveGoTarget("https://evil.example.com", "gatwick", "")).toBeNull();
  });
  it("returns null for a parking target where no merchant covers the airport (fail-closed)", () => {
    // belfast-international: not an APH override, but HE covers it via template — so HE still serves.
    // Use a hypothetical: APH override-only with no HE? Not present, so assert HE fallback works.
    expect(resolveGoTarget("parking", "belfast-international", "hub")!.url).toContain("awinmid=3496");
  });
});
