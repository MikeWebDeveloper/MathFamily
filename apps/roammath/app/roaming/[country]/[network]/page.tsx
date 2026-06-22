import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRoamingDataset, loadEsimDataset, NETWORKS, type RoamingDestination, type EsimCountry, type NetworkRoaming } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd } from "@mathfamily/geo";
import { EmailCaptureSlot, FaqAccordion, FreshnessBadge, SourcesBlock } from "@mathfamily/ui";
import { buildRoamingFaqs, NETWORK_LABELS } from "@/lib/roaming-content";
import { resolveSlot } from "@/lib/partners";
import { RoamingAnswer } from "@/components/roaming-answer";

export const dynamicParams = false;

export function generateStaticParams() {
  const { destinations } = loadRoamingDataset();
  return destinations.flatMap((d) =>
    NETWORKS.map((network) => ({ country: d.countrySlug, network }))
  );
}

function getData(
  countrySlug: string,
  networkSlug: string
): { destination: RoamingDestination; networkData: NetworkRoaming; esim: EsimCountry | null } | null {
  if (!(NETWORKS as readonly string[]).includes(networkSlug)) return null;
  const destination = loadRoamingDataset().destinations.find((d) => d.countrySlug === countrySlug);
  if (!destination) return null;
  const networkData = destination.perNetwork.find((n) => n.network === networkSlug);
  if (!networkData) return null;
  const esim = loadEsimDataset().records.find((r) => r.countrySlug === countrySlug) ?? null;
  return { destination, networkData, esim };
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ country: string; network: string }>;
}): Promise<Metadata> {
  const { country, network } = await params;
  const data = getData(country, network);
  if (!data) return {};
  const { destination, networkData } = data;
  const networkLabel = NETWORK_LABELS[network] ?? network;
  const desc = networkData.included
    ? `${networkLabel} customers roam in ${destination.countryName} at no extra daily charge (fair-use limits apply).`
    : networkData.dailyPassPence !== null
      ? `${networkLabel} charges ${formatPence(networkData.dailyPassPence)}/day for roaming in ${destination.countryName}.`
      : `${networkLabel} has no standard daily roaming pass for ${destination.countryName} — see the price guide.`;
  return {
    title: `${networkLabel} roaming in ${destination.countryName} — 2026 charges`,
    description: desc
  };
}

export default async function NetworkPage({
  params
}: {
  params: Promise<{ country: string; network: string }>;
}) {
  const { country: countrySlug, network: networkSlug } = await params;
  const data = getData(countrySlug, networkSlug);
  if (!data) notFound();
  const { destination, networkData, esim } = data;

  const networkLabel = NETWORK_LABELS[networkSlug] ?? networkSlug;
  const { networkSources } = loadRoamingDataset();
  const networkSource = networkSources.find((s) => s.network === networkSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  // eSIM affiliate provider (Airalo inactive until AWIN approved — falls back to official site)
  const officialAiraloUrl = `https://www.airalo.com/${countrySlug}-esim`;
  const esimSlot = resolveSlot("airalo", countrySlug, officialAiraloUrl);

  // FAQ: just this network's question + eSIM question
  const allFaqs = buildRoamingFaqs(destination, esim, 7);
  const thisNetworkFaq = allFaqs.find((f) => f.question.includes(networkLabel));
  const esimFaq = allFaqs.find((f) => f.question.toLowerCase().includes("esim"));
  const pageFaqs = [thisNetworkFaq, esimFaq].filter(Boolean) as { question: string; answer: string }[];

  const sources = [
    ...(networkSource
      ? [{ label: `${networkLabel} official price guide`, url: networkSource.sourceUrl, verifiedAt: networkSource.verifiedAt }]
      : []),
    ...(esim ? [{ label: "eSIM comparison (Airalo, Holafly, Saily)", url: esim.sourceUrl, verifiedAt: esim.verifiedAt }] : [])
  ];

  // Build serializable NetworkRoamingOption from networkData
  const networkOption = {
    network: networkData.network,
    included: networkData.included,
    dailyPassPence: networkData.dailyPassPence,
    passName: networkData.passName,
    fairUseNote: networkData.fairUseNote,
  };

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(pageFaqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Roaming charges", url: `${siteUrl}/roaming` },
          { name: destination.countryName, url: `${siteUrl}/roaming/${destination.countrySlug}` },
          { name: networkLabel, url: `${siteUrl}/roaming/${destination.countrySlug}/${networkSlug}` }
        ])}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">
          {networkLabel} roaming in {destination.countryName}
        </h1>
        {networkSource && <FreshnessBadge verifiedAt={networkSource.verifiedAt} />}
      </header>

      {/* Reactive answer — hero + comparison + eSIM CTA all from a single useState/roamingTripCost call */}
      <RoamingAnswer
        networkOption={networkOption}
        esimBundles={esim?.bundles ?? []}
        networkLabel={networkLabel}
        countryName={destination.countryName}
        countrySlug={countrySlug}
        esimSlot={esimSlot}
        defaultDays={7}
        defaultDataGb={5}
      />

      {pageFaqs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
          <FaqAccordion items={pageFaqs} />
        </section>
      )}

      <p className="text-sm">
        <Link
          href={`/roaming/${destination.countrySlug}`}
          className="text-brand-accent underline underline-offset-4"
        >
          ← All networks in {destination.countryName}
        </Link>
      </p>

      <EmailCaptureSlot
        formAction={process.env.NEXT_PUBLIC_MAILERLITE_FORM_ACTION}
        hook={`Get notified when ${networkLabel} roaming in ${destination.countryName} changes`}
      />

      <SourcesBlock
        sources={sources}
        method="Daily roaming charges are from the network's official published price guide. eSIM prices are dated snapshots from providers' own public store pages."
      />
    </article>
  );
}
