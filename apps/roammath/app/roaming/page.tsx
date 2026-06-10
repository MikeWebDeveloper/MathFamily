import type { Metadata } from "next";
import Link from "next/link";
import { loadRoamingDataset, loadEsimDataset, NETWORKS } from "@mathfamily/data";
import { roamingTripCost, formatPence } from "@mathfamily/engine";
import { datasetLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid, FreshnessBadge } from "@mathfamily/ui";
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
        className="font-medium text-brand-accent underline-offset-4 hover:underline"
      >
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
        data={datasetLd({
          name: "UK mobile roaming charges by destination",
          description:
            "Daily roaming charges for EE, O2, Vodafone and Three across 40 destinations, with eSIM alternatives — verified against official network price guides.",
          url: `${siteUrl}/roaming`,
          dateModified: latestVerified,
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
        <h1 className="text-3xl font-bold text-ink">UK mobile roaming charges, by destination</h1>
        <FreshnessBadge verifiedAt={latestVerified} />
      </header>

      <p className="text-ink-muted">
        Daily pass prices from official network price guides for all four major UK networks. Click a destination for the
        full comparison, calculator and eSIM alternatives.
      </p>

      <FeeGrid
        caption="Daily charge per network. 'included' = no extra cost. eSIM column = cheapest eligible bundle for a 7-day / 5GB trip."
        columns={["Destination", "EE", "O2", "Vodafone", "Three", "Best eSIM (5GB/7d)"]}
        rows={rows}
      />

      <p className="text-sm text-ink-muted">
        Network sources verified {latestVerified}. eSIM prices are dated snapshots — check providers for live prices.
        {" "}† converted from the provider&apos;s USD price at an indicative rate.
      </p>
    </article>
  );
}
