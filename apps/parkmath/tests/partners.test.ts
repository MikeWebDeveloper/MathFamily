import { describe, expect, it } from "vitest";
import { activeSlotPartnerName, buildAwinLink, goLink, heAirportParkingUrl, resolveGoTarget, resolveHeProduct, resolveSlot } from "../lib/partners";

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
    expect(r.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
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
  it("parking deep-links to the airport's own HE page (verified per-airport URL)", () => {
    const r = resolveHeProduct("parking", "gatwick", "dropoff");
    expect(r!.url).toContain("clickref=parkmath-gatwick-dropoff");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
  });
  it("parking falls back to the generic page off-airport (slug 'home')", () => {
    const r = resolveHeProduct("parking", "home", "home");
    expect(r!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-parking.html");
  });
});

describe("heAirportParkingUrl", () => {
  it("builds the verified per-airport HE parking URL", () => {
    expect(heAirportParkingUrl("heathrow")).toBe("https://www.holidayextras.com/heathrow-airport-parking.html");
  });
  it("returns null for non-airport contexts (fall back to generic)", () => {
    expect(heAirportParkingUrl("home")).toBeNull();
    expect(heAirportParkingUrl("")).toBeNull();
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
  it("parking-prebook rebuilds the same URL resolveSlot produced (byte-identical)", () => {
    // The redirect destination must equal what the component used to render directly — same
    // awinmid/awinaffid/clickref/ued — so AWIN attribution is untouched by the new /go hop.
    const direct = resolveSlot("parking-prebook", "gatwick", "");
    const viaGo = resolveGoTarget("parking-prebook", "gatwick", "");
    expect(viaGo).not.toBeNull();
    expect(viaGo!.url).toBe(direct.url);
    expect(viaGo!.url).toContain("awinmid=3496");
    expect(viaGo!.url).toContain("awinaffid=2932035");
    expect(viaGo!.url).toContain("clickref=parkmath-gatwick");
    expect(viaGo!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fgatwick-airport-parking.html");
  });
  it("an HE product target rebuilds the same URL resolveHeProduct produced (with surface clickref)", () => {
    const direct = resolveHeProduct("hotels", "gatwick", "dropoff-hotels");
    const viaGo = resolveGoTarget("hotels", "gatwick", "dropoff-hotels");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("clickref=parkmath-gatwick-dropoff-hotels");
  });
  it("lounge target with lounge surface matches the direct lounge deep link", () => {
    const direct = resolveHeProduct("lounge", "gatwick", "lounge");
    const viaGo = resolveGoTarget("lounge", "gatwick", "lounge");
    expect(viaGo!.url).toBe(direct!.url);
    expect(viaGo!.url).toContain("ued=https%3A%2F%2Fwww.holidayextras.com%2Fairport-lounges.html");
  });
  it("returns null for an unknown target (route 404s — never an open redirect)", () => {
    expect(resolveGoTarget("evil", "gatwick", "")).toBeNull();
    expect(resolveGoTarget("https://evil.example.com", "gatwick", "")).toBeNull();
  });
});
