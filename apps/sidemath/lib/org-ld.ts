import { organizationLd } from "@mathfamily/geo";

/**
 * SideMath Organization JSON-LD with a `parentOrganization` pointer to "The Math Family".
 *
 * The shared `organizationLd` builder is read-only and doesn't model parentOrganization,
 * so we spread its output and add the field app-locally (no shared-package change). This
 * keeps the @id/url/logo/founder shape identical to the rest of the family while declaring
 * the portfolio relationship search/answer engines use for E-E-A-T.
 */
export function sideMathOrganizationLd(input: {
  siteUrl: string;
  logoUrl: string;
  founder?: { name: string; jobTitle: string };
}) {
  return {
    ...organizationLd({ siteUrl: input.siteUrl, name: "SideMath", logoUrl: input.logoUrl, founder: input.founder }),
    parentOrganization: {
      "@type": "Organization" as const,
      name: "The Math Family",
      description: "A family of faceless UK cost-and-tax calculators verified against official sources."
    }
  };
}
