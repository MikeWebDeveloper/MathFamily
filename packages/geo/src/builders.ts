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

/** HowTo — for a step-by-step "how to avoid the X charge" page. Steps are built only from
 *  verified dataset facts (the free alternative, Blue Badge policy, payment deadline); we never
 *  fabricate a step or a price. No cost/supply fields are emitted (this is a money-saving how-to,
 *  not a purchasable product). */
export function howToLd(input: { name: string; description: string; url: string; steps: { name: string; text: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo" as const,
    name: input.name,
    description: input.description,
    url: input.url,
    step: input.steps.map((s, index) => ({
      "@type": "HowToStep" as const,
      position: index + 1,
      name: s.name,
      text: s.text
    }))
  };
}

/** Organization JSON-LD for a brand site.
 *
 *  `parentOrganization` (optional) emits a proper portfolio-parent node carrying BOTH a `name`
 *  and a `url` (plus a stable `@id` derived from that url, so the parent is a referenceable
 *  entity, not an inline string). All 9 family apps pass
 *  `{ name: "The Math Family", url: "https://themathfamily.com" }` to declare the same parent
 *  consistently — replacing the per-app spread hacks that previously emitted name-only (or
 *  malformed duplicate) blocks. Backward-compatible: omit it and no parentOrganization is emitted. */
export function organizationLd(input: { siteUrl: string; name: string; logoUrl: string; sameAs?: string[]; founder?: { name: string; jobTitle: string; sameAs?: string[] }; parentOrganization?: { name: string; url: string } }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${input.siteUrl}/#organization`,
    name: input.name,
    url: input.siteUrl,
    logo: { "@type": "ImageObject" as const, url: input.logoUrl },
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {}),
    ...(input.founder ? { founder: { "@type": "Person" as const, "@id": `${input.siteUrl}/#person`, name: input.founder.name, jobTitle: input.founder.jobTitle, ...(input.founder.sameAs?.length ? { sameAs: input.founder.sameAs } : {}) } } : {}),
    ...(input.parentOrganization ? { parentOrganization: { "@type": "Organization" as const, "@id": `${input.parentOrganization.url}/#organization`, name: input.parentOrganization.name, url: input.parentOrganization.url } } : {})
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

/**
 * Table — schema.org structured data for a data table (a comparison/league table).
 * Emits a `Table` whose `about` describes the comparison subject and whose `mainEntity`
 * carries the column headers + a row count, so the table reads as a first-class data object
 * (not just a styled grid). Used by the multi-airport drop-off comparison hub.
 */
export function tableLd(input: {
  about: string;
  url: string;
  columns: string[];
  rowCount: number;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Table" as const,
    about: input.about,
    url: input.url,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "PropertyValue" as const,
      name: "columns",
      value: input.columns.join(", "),
      valueReference: { "@type": "PropertyValue" as const, name: "rowCount", value: input.rowCount }
    }
  };
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
  description: string;
  image: string;
  url: string;
  pricePence: number;
  priceValidUntil: string;
  brand?: string;
  availability?: string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product" as const,
    name: input.name,
    description: input.description,
    image: [input.image],
    ...(input.brand ? { brand: { "@type": "Brand" as const, name: input.brand } } : {}),
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
  image: string;
  url: string;
  lowPricePence: number;
  highPricePence: number;
  offerCount: number;
  priceValidUntil: string;
  brand?: string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product" as const,
    name: input.name,
    description: input.description,
    image: [input.image],
    ...(input.brand ? { brand: { "@type": "Brand" as const, name: input.brand } } : {}),
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
  authorName?: string;
  authorJobTitle?: string;
}) {
  const org = { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization`, name: input.publisherName ?? "ParkMath" };
  const author = input.authorName
    ? { "@type": "Person" as const, "@id": `${input.siteUrl}/#person`, name: input.authorName, jobTitle: input.authorJobTitle }
    : org;
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
    author,
    publisher: org
  };
}

export function personLd(input: { siteUrl: string; name: string; jobTitle: string; sameAs?: string[]; url?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person" as const,
    "@id": `${input.siteUrl}/#person`,
    name: input.name,
    jobTitle: input.jobTitle,
    url: input.url ?? input.siteUrl,
    worksFor: { "@type": "Organization" as const, "@id": `${input.siteUrl}/#organization` },
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {})
  };
}

export function speakableLd(input: { url: string; cssSelectors?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage" as const,
    url: input.url,
    speakable: { "@type": "SpeakableSpecification" as const, cssSelector: input.cssSelectors ?? ["h1", ".mf-speakable"] }
  };
}
