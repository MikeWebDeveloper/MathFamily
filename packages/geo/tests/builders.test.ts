import { describe, expect, it } from "vitest";
import { aggregateOfferLd, breadcrumbLd, datasetLd, faqPageLd, itemListLd, offerLd, webSiteLd, newsArticleLd, organizationLd, personLd, speakableLd } from "../src/builders";

describe("faqPageLd", () => {
  it("builds a FAQPage with one Question per item", () => {
    const ld = faqPageLd([{ question: "Q1?", answer: "A1" }, { question: "Q2?", answer: "A2" }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toMatchObject({ "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1" } });
  });
});

describe("datasetLd", () => {
  it("builds a Dataset whose creator references the Organization @id", () => {
    const ld = datasetLd({
      name: "UK airport drop-off fees",
      description: "Current drop-off charges at 25 UK airports",
      url: "https://example.com/drop-off-charges",
      dateModified: "2026-06-10",
      siteUrl: "https://example.com",
      creatorName: "ParkMath"
    });
    expect(ld["@type"]).toBe("Dataset");
    expect(ld.dateModified).toBe("2026-06-10");
    expect(ld.isAccessibleForFree).toBe(true);
    expect(ld.creator).toEqual({ "@type": "Organization", "@id": "https://example.com/#organization", name: "ParkMath" });
  });
});

describe("organizationLd", () => {
  it("has a stable @id, url and logo, and omits empty sameAs", () => {
    const o = organizationLd({ siteUrl: "https://example.com", name: "ParkMath", logoUrl: "https://example.com/opengraph-image" });
    expect(o["@type"]).toBe("Organization");
    expect(o["@id"]).toBe("https://example.com/#organization");
    expect(o.url).toBe("https://example.com");
    expect(o.logo).toEqual({ "@type": "ImageObject", url: "https://example.com/opengraph-image" });
    expect("sameAs" in o).toBe(false);
  });
});

describe("breadcrumbLd", () => {
  it("numbers positions from 1", () => {
    const ld = breadcrumbLd([
      { name: "Home", url: "https://example.com" },
      { name: "Drop-off", url: "https://example.com/drop-off-charges" }
    ]);
    expect(ld.itemListElement[1]).toMatchObject({ position: 2, name: "Drop-off", item: "https://example.com/drop-off-charges" });
  });
});

describe("webSiteLd", () => {
  it("builds a WebSite", () => {
    expect(webSiteLd({ name: "ParkMath", url: "https://example.com" })["@type"]).toBe("WebSite");
  });
});

describe("itemListLd", () => {
  it("builds an ItemList with positioned items", () => {
    const ld = itemListLd({
      name: "Cheapest 7-day parking at Manchester",
      items: [
        { name: "JetParks 1 — £42", url: "https://example.com/a" },
        { name: "Short Stay — £90", url: "https://example.com/b" }
      ]
    });
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[1]).toMatchObject({ "@type": "ListItem", position: 2, name: "Short Stay — £90" });
  });
});

describe("offerLd", () => {
  it("builds a Product with a single Offer, converting pence to pounds", () => {
    const ld = offerLd({
      name: "Gatwick drop-off charge",
      description: "Gatwick drop-off forecourt charge",
      image: "https://example.com/drop-off-charges/gatwick/opengraph-image",
      url: "https://example.com/drop-off-charges/gatwick",
      pricePence: 600,
      priceValidUntil: "2026-08-10",
      brand: "Gatwick Airport"
    }) as any;
    expect(ld["@type"]).toBe("Product");
    expect(ld.description).toBe("Gatwick drop-off forecourt charge");
    expect(ld.image).toEqual(["https://example.com/drop-off-charges/gatwick/opengraph-image"]);
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Gatwick Airport" });
    expect(ld.offers).toMatchObject({
      "@type": "Offer",
      price: "6.00",
      priceCurrency: "GBP",
      priceValidUntil: "2026-08-10",
      availability: "https://schema.org/InStock",
      url: "https://example.com/drop-off-charges/gatwick"
    });
  });
});

describe("aggregateOfferLd", () => {
  it("builds a Product with an AggregateOffer spanning low/high prices", () => {
    const ld = aggregateOfferLd({
      name: "Heathrow airport parking",
      description: "Gate vs pre-book parking at Heathrow",
      image: "https://example.com/airport-parking/heathrow/opengraph-image",
      url: "https://example.com/airport-parking/heathrow",
      lowPricePence: 4200,
      highPricePence: 9000,
      offerCount: 5,
      priceValidUntil: "2026-08-10",
      brand: "Heathrow Airport"
    }) as any;
    expect(ld["@type"]).toBe("Product");
    expect(ld.description).toBe("Gate vs pre-book parking at Heathrow");
    expect(ld.image).toEqual(["https://example.com/airport-parking/heathrow/opengraph-image"]);
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Heathrow Airport" });
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "42.00",
      highPrice: "90.00",
      offerCount: 5,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2026-08-10",
      url: "https://example.com/airport-parking/heathrow"
    });
  });
});

describe("newsArticleLd", () => {
  it("emits a NewsArticle with image, author and an @id-referenced publisher", () => {
    const ld = newsArticleLd({
      headline: "Heathrow drop-off rises to £7",
      description: "Heathrow raised its forecourt drop-off charge to £7.",
      url: "https://www.parkmath.co.uk/news/heathrow-dropoff-fee-jun-2026",
      datePublished: "2026-06-01", dateModified: "2026-06-02",
      sourceUrl: "https://www.heathrow.com/x",
      siteUrl: "https://www.parkmath.co.uk",
      imageUrl: "https://www.parkmath.co.uk/opengraph-image"
    }) as any;
    expect(ld["@type"]).toBe("NewsArticle");
    expect(ld.headline).toContain("Heathrow");
    expect(ld.datePublished).toBe("2026-06-01");
    expect(ld.dateModified).toBe("2026-06-02");
    expect(ld.isBasedOn).toBe("https://www.heathrow.com/x");
    expect(ld.image).toEqual(["https://www.parkmath.co.uk/opengraph-image"]);
    expect(ld.author).toEqual({ "@type": "Organization", "@id": "https://www.parkmath.co.uk/#organization", name: "ParkMath" });
    expect(ld.publisher).toEqual({ "@type": "Organization", "@id": "https://www.parkmath.co.uk/#organization", name: "ParkMath" });
  });
});

describe("personLd", () => {
  it("emits a Person with @id, name, jobTitle and worksFor the org @id, no sameAs when none given", () => {
    const p = personLd({ siteUrl: "https://parkmath.co.uk", name: "Michal Latal", jobTitle: "Founder & editor" });
    expect(p["@type"]).toBe("Person");
    expect(p["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(p.name).toBe("Michal Latal");
    expect(p.jobTitle).toBe("Founder & editor");
    expect(p.worksFor["@id"]).toBe("https://parkmath.co.uk/#organization");
    expect("sameAs" in p).toBe(false);
  });
  it("includes sameAs only when non-empty", () => {
    const p = personLd({ siteUrl: "https://x.co", name: "A", jobTitle: "B", sameAs: ["https://x.co/a"] });
    expect(p.sameAs).toEqual(["https://x.co/a"]);
  });
});

describe("speakableLd", () => {
  it("emits a WebPage with a SpeakableSpecification of cssSelectors", () => {
    const s = speakableLd({ url: "https://x.co/p" });
    expect(s["@type"]).toBe("WebPage");
    expect(s.url).toBe("https://x.co/p");
    expect(s.speakable["@type"]).toBe("SpeakableSpecification");
    expect(s.speakable.cssSelector).toEqual(["h1", ".mf-speakable"]);
  });
  it("accepts custom selectors", () => {
    const s = speakableLd({ url: "https://x.co/p", cssSelectors: ["#a"] });
    expect(s.speakable.cssSelector).toEqual(["#a"]);
  });
});

describe("organizationLd founder", () => {
  it("includes founder Person when provided", () => {
    const org = organizationLd({
      siteUrl: "https://parkmath.co.uk", name: "ParkMath", logoUrl: "https://parkmath.co.uk/logo",
      founder: { name: "Michal Latal", jobTitle: "Founder & editor" }
    });
    expect(org.founder!["@type"]).toBe("Person");
    expect(org.founder!["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(org.founder!.name).toBe("Michal Latal");
  });
  it("omits founder when not provided", () => {
    const org = organizationLd({ siteUrl: "https://x.co", name: "X", logoUrl: "https://x.co/l" });
    expect("founder" in org).toBe(false);
  });
});

describe("newsArticleLd author", () => {
  it("uses a Person author when authorName given, org stays publisher", () => {
    const a = newsArticleLd({
      headline: "H", description: "D", url: "https://parkmath.co.uk/news/x", datePublished: "2026-01-01",
      dateModified: "2026-01-02", sourceUrl: "https://src", siteUrl: "https://parkmath.co.uk",
      imageUrl: "https://img", authorName: "Michal Latal", authorJobTitle: "Founder & editor"
    });
    expect(a.author["@type"]).toBe("Person");
    expect(a.author["@id"]).toBe("https://parkmath.co.uk/#person");
    expect(a.author.name).toBe("Michal Latal");
    expect(a.publisher["@type"]).toBe("Organization");
  });
  it("falls back to org author when no authorName", () => {
    const a = newsArticleLd({
      headline: "H", description: "D", url: "u", datePublished: "p", dateModified: "m",
      sourceUrl: "s", siteUrl: "https://x.co", imageUrl: "i"
    });
    expect(a.author["@type"]).toBe("Organization");
  });
});
