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

export function datasetLd(input: {
  name: string;
  description: string;
  url: string;
  dateModified: string;
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
    creator: { "@type": "Organization" as const, name: input.creatorName }
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
