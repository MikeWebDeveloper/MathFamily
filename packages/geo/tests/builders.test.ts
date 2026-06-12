import { describe, expect, it } from "vitest";
import { breadcrumbLd, datasetLd, faqPageLd, itemListLd, webSiteLd, newsArticleLd, organizationLd } from "../src/builders";

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
