/**
 * App-local Organization JSON-LD with `parentOrganization` = "The Math Family".
 *
 * The shared @mathfamily/geo `organizationLd` builder (read-only package) does not emit a
 * parentOrganization, and the build brief requires PetMath to declare its parent. So we build the
 * Organization node here. Everything else (FAQ, breadcrumb, dataset, website) still uses the shared
 * geo builders.
 */
export function petmathOrganizationLd(input: {
  siteUrl: string;
  name: string;
  logoUrl: string;
  founder?: { name: string; jobTitle: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    "@id": `${input.siteUrl}/#organization`,
    name: input.name,
    url: input.siteUrl,
    logo: { "@type": "ImageObject" as const, url: input.logoUrl },
    parentOrganization: { "@type": "Organization" as const, name: "The Math Family" },
    ...(input.founder
      ? {
          founder: {
            "@type": "Person" as const,
            "@id": `${input.siteUrl}/#person`,
            name: input.founder.name,
            jobTitle: input.founder.jobTitle,
          },
        }
      : {}),
  };
}
