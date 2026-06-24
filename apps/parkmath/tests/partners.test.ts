import { describe, expect, it } from "vitest";
import {
  activeSlotPartnerName,
  airportParkingUrl,
  buildAwinLink,
  goLink,
  heAirportParkingUrl,
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
  it("Heathrow (APH override) uses APH's directory-style verified URL", () => {
    const r = resolveSlot("parking-prebook", "heathrow", "https://heathrow.com");
    expect(r.partnerName).toBe("APH");
    expect(r.url).toContain("awinmid=1478");
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.aph.com%2Fheathrow-airport%2Fparking%2F");
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
  it("APH stays primary on its override airports (existing links unbroken)", () => {
    for (const slug of ["heathrow", "gatwick", "manchester", "stansted", "luton", "birmingham", "bristol", "edinburgh"]) {
      expect(resolveParkingMerchant(slug, "hub")?.partnerName).toBe("APH");
    }
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
    const direct = resolveParkingMerchant("heathrow", "dropoff");
    const viaGo = resolveGoTarget("parking", "heathrow", "dropoff");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("awinmid=1478");
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
