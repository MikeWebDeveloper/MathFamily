import type { Metadata } from "next";
import Link from "next/link";
import { loadRoamingDataset, loadEsimDataset, NETWORKS } from "@mathfamily/data";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { CountryFlag, EmailCaptureSlot, FeeGrid, FreshnessBadge, OpenDataBand, PageHeading } from "@mathfamily/ui";
import { NETWORK_LABELS } from "@/lib/roaming-content";

export const metadata: Metadata = {
  title: "UK mobile roaming charges by destination — EE, O2, Vodafone, Three",
  description:
    "All four UK networks' roaming charges for 40 destinations — daily pass prices, included zones and eSIM alternatives, verified against official price guides."
};

export default function RoamingIndexPage() {
  const { destinations, networkSources } = loadRoamingDataset();
  const esimDataset = loadEsimDataset();
  const esimMap = new Map(esimDataset.records.map((r) => [r.countrySlug, r]));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const latestVerified = networkSources.map((s) => s.verifiedAt).sort().at(-1) ?? "";

  const rows = destinations.map((dest) => {
    const esim = esimMap.get(dest.countrySlug) ?? null;
    const r = roamingTripCost(dest.perNetwork, esim?.bundles ?? [], 7, 5);

    const networkCell = (network: string) => {
      const n = dest.perNetwork.find((p) => p.network === network);
      if (!n) return "—";
      if (n.included) return "included";
      if (n.dailyPassPence === null) return "no standard pass";
      return `${formatPence(n.dailyPassPence)}/day`;
    };

    const esimCell = r.esimChoice
      ? `${formatPence(r.esimChoice.totalPence)}${r.esimChoice.bundleName.includes("(converted)") ? "†" : ""}`
      : "—";

    return [
      <Link
        key="dest"
        href={`/roaming/${dest.countrySlug}`}
        className="inline-flex items-center gap-2 font-medium text-brand-accent underline-offset-4 hover:underline"
      >
        <CountryFlag iso2={dest.iso2} size={16} />
        {dest.countryName}
      </Link>,
      networkCell("ee"),
      networkCell("o2"),
      networkCell("vodafone"),
      networkCell("three"),
      esimCell
    ];
  });

  const itemListItems = destinations.map((dest) => {
    const n = dest.perNetwork;
    const included = n.filter((p) => p.included).map((p) => NETWORK_LABELS[p.network] ?? p.network);
    const cheapestPaid = n
      .filter((p) => !p.included && p.dailyPassPence !== null)
      .sort((a, b) => (a.dailyPassPence ?? 0) - (b.dailyPassPence ?? 0))[0];
    const label =
      included.length > 0
        ? `${dest.countryName} — ${included.join("/")} included / from ${cheapestPaid ? formatPence(cheapestPaid.dailyPassPence!) + " per day" : "daily charge"}`
        : cheapestPaid
          ? `${dest.countryName} — from ${formatPence(cheapestPaid.dailyPassPence!)} per day`
          : `${dest.countryName} — see network price guides`;
    return { name: label, url: `${siteUrl}/roaming/${dest.countrySlug}` };
  });

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Roaming charges", url: `${siteUrl}/roaming` }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "UK mobile roaming charges by destination",
          description:
            "Daily roaming charges for EE, O2, Vodafone and Three across 40 destinations, with eSIM alternatives — verified against official network price guides.",
          url: `${siteUrl}/roaming`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "RoamMath"
        })}
      />
      <JsonLd
        data={itemListLd({
          name: "UK roaming charges by destination",
          items: itemListItems
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK mobile roaming charges, by destination</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>

      <p className="text-ink-muted">
        Daily pass prices from official network price guides for all four major UK networks. Click a destination for the
        full comparison, calculator and eSIM alternatives.
      </p>

      <nav aria-label="Destinations" className="mf-reveal flex flex-wrap gap-2">
        {destinations.map((dest) => (
          <Link
            key={dest.countrySlug}
            href={`/roaming/${dest.countrySlug}`}
            className="mf-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/5"
          >
            <CountryFlag iso2={dest.iso2} size={18} />
            {dest.countryName}
          </Link>
        ))}
      </nav>

      <FeeGrid
        caption="Daily charge per network. 'included' = no extra cost. eSIM column = cheapest eligible bundle for a 7-day / 5GB trip."
        columns={["Destination", "EE", "O2", "Vodafone", "Three", "Best eSIM (5GB/7d)"]}
        numericColumns={[1, 2, 3, 4, 5]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Network sources verified {latestVerified}. eSIM prices are dated snapshots — check providers for live prices.
        {" "}† converted from the provider&apos;s USD price at an indicative rate.
      </p>

      <OpenDataBand
        downloads={[{ href: "/data/roaming-charges.csv", label: "Roaming charges (CSV)" }]}
        citation={`RoamMath, "UK mobile roaming charges by destination", verified ${latestVerified}, roammath.co.uk`}
      />

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook="Get notified when roaming charges change"
      />
    </article>
  );
}
