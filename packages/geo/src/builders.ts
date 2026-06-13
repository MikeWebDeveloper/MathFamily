export function faqPageLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage" as const,
    mainEntity: items.map((i) => ({
      "@type": "Question" as const,
      name: i.question,
      acceptedAnswer: { "@type": "Answer" as const, text: i.answer }
    }))
  };
}

export function organizationLd(input: { siteUrl: string; name: string; logoUrl: string; sameAs?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${input.siteUrl}/#organization`,
    name: input.name,
    url: input.siteUrl,
    logo: { "@type": "ImageObject" as const, url: input.logoUrl },
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {})
  };
}

export function datasetLd(input: {
  name: string;
  description: string;
  url: string;
  dateModified: string;
  siteUrl: string;
  creatorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset" as const,
    name: input.name,
    description: input.description,
    url: input.url,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    creator: { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization`, name: input.creatorName }
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function webSiteLd(input: { name: string; url: string }) {
  return { "@context": "https://schema.org", "@type": "WebSite" as const, name: input.name, url: input.url };
}

export function itemListLd(input: { name: string; items: { name: string; url: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList" as const,
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      url: item.url
    }))
  };
}

function poundsFromPence(pence: number): string {
  return (pence / 100).toFixed(2);
}

/** Product + single Offer — for a one-price page (e.g. a drop-off charge). */
export function offerLd(input: {
  name: string;
  url: string;
  pricePence: number;
  priceValidUntil: string;
  availability?: string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product" as const,
    name: input.name,
    offers: {
      "@type": "Offer" as const,
      price: poundsFromPence(input.pricePence),
      priceCurrency: input.priceCurrency ?? "GBP",
      priceValidUntil: input.priceValidUntil,
      availability: input.availability ?? "https://schema.org/InStock",
      url: input.url
    }
  };
}

/** Product + AggregateOffer — for a price-comparison page (multiple parking options). */
export function aggregateOfferLd(input: {
  name: string;
  description: string;
  url: string;
  lowPricePence: number;
  highPricePence: number;
  offerCount: number;
  priceValidUntil: string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product" as const,
    name: input.name,
    description: input.description,
    offers: {
      "@type": "AggregateOffer" as const,
      lowPrice: poundsFromPence(input.lowPricePence),
      highPrice: poundsFromPence(input.highPricePence),
      offerCount: input.offerCount,
      priceCurrency: input.priceCurrency ?? "GBP",
      availability: "https://schema.org/InStock",
      priceValidUntil: input.priceValidUntil,
      url: input.url
    }
  };
}

export function newsArticleLd(input: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  sourceUrl: string;
  siteUrl: string;
  imageUrl: string;
  publisherName?: string;
}) {
  const org = { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization`, name: input.publisherName ?? "ParkMath" };
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle" as const,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    image: [input.imageUrl],
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    isBasedOn: input.sourceUrl,
    isAccessibleForFree: true,
    author: org,
    publisher: org
  };
}
