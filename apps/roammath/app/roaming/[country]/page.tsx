import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRoamingDataset, loadEsimDataset, NETWORKS, type RoamingDestination, type EsimCountry } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, JsonLd, speakableLd } from "@mathfamily/geo";
import { AnswerLead, AnswerPassage, CountryFlag, FaqAccordion, FeeGrid, FreshnessBadge, MiniAnswerBar, PageHeading, RegionMap, SavesVerdict, SourceCitation, SourcesBlock } from "@mathfamily/ui";
import { RoamingCalculator } from "@/components/roaming-calculator";
import { AffiliateBlock } from "@/components/affiliate-block";
import { buildRoamingFaqs, roamingPageModel, NETWORK_LABELS } from "@/lib/roaming-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadRoamingDataset().destinations.map((d) => ({ country: d.countrySlug }));
}

function getData(slug: string): { destination: RoamingDestination; esim: EsimCountry | null } | null {
  const destination = loadRoamingDataset().destinations.find((d) => d.countrySlug === slug);
  if (!destination) return null;
  const esim = loadEsimDataset().records.find((r) => r.countrySlug === slug) ?? null;
  return { destination, esim };
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const data = getData(country);
  if (!data) return {};
  const { destination, esim } = data;
  const m = roamingPageModel(destination, esim, 7, 5);
  return {
    title: `${destination.countryName} roaming charges 2026 — EE, O2, Vodafone, Three & eSIM`,
    description: `${m.answer} Verified against official network price guides.`
  };
}

export default async function CountryHubPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { destination, esim } = data;

  const { networkSources } = loadRoamingDataset();
  const latestVerified = networkSources.map((s) => s.verifiedAt).sort().at(-1) ?? "";

  const m = roamingPageModel(destination, esim, 7, 5);
  // Short, figure-first line for the sticky bar (the full sentence would truncate).
  const miniPrices = [m.cheapestNetwork?.totalPence, m.esimChoice?.totalPence].filter(
    (p): p is number => p != null && p > 0
  );
  const miniSummary = m.cheapestNetwork?.included
    ? `${destination.countryName} · included on ${NETWORK_LABELS[m.cheapestNetwork.network] ?? m.cheapestNetwork.network}`
    : miniPrices.length > 0
      ? `${destination.countryName} · 7 days from ${formatPence(Math.min(...miniPrices))}`
      : `${destination.countryName} · see network price guides`;
  const faqs = buildRoamingFaqs(destination, esim, 7);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const networkFacts = destination.perNetwork.map((n) => {
    const label = NETWORK_LABELS[n.network] ?? n.network;
    if (n.included) return `${label}: included at no extra daily charge${n.fairUseNote ? ` (${n.fairUseNote})` : ""}`;
    if (n.dailyPassPence === null) return `${label}: no standard daily pass — check price guide`;
    return `${label}: ${formatPence(n.dailyPassPence)}/day${n.passName ? ` (${n.passName})` : ""}${n.fairUseNote ? `; ${n.fairUseNote}` : ""}`;
  });

  if (m.esimChoice) {
    networkFacts.push(
      `Best eSIM: ${formatPence(m.esimChoice.totalPence)} (${m.esimChoice.provider}, ${m.esimChoice.bundleName}, snapshot ${m.esimChoice.snapshotDate})`
    );
  }

  const sources = [
    ...networkSources.map((s) => ({
      label: `${NETWORK_LABELS[s.network] ?? s.network} official price guide`,
      url: s.sourceUrl,
      verifiedAt: s.verifiedAt
    })),
    ...(esim
      ? [{ label: `eSIM comparison (Airalo, Holafly, Saily)`, url: esim.sourceUrl, verifiedAt: esim.verifiedAt }]
      : [])
  ];

  return (
    <article className="space-y-8">
      <JsonLd data={faqPageLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Roaming charges", url: `${siteUrl}/roaming` },
          { name: destination.countryName, url: `${siteUrl}/roaming/${destination.countrySlug}` }
        ])}
      />
      <JsonLd data={speakableLd({ url: `${siteUrl}/roaming/${destination.countrySlug}` })} />

      <header className="relative space-y-3">
        <CountryFlag
          iso2={destination.iso2}
          size={260}
          className="pointer-events-none absolute -top-10 right-0 hidden opacity-[0.06] sm:block"
        />
        <div className="flex items-center gap-3">
          <CountryFlag iso2={destination.iso2} size={36} className="shrink-0 rounded-full shadow-sm" />
          <PageHeading>{destination.countryName} roaming charges: all four UK networks compared</PageHeading>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FreshnessBadge verifiedAt={latestVerified} />
          {networkSources.slice(0, 1).map((s) => (
            <span key={s.network} className="hidden sm:inline-flex">
              <SourceCitation url={s.sourceUrl} label={`${NETWORK_LABELS[s.network] ?? s.network} price guide`} />
            </span>
          ))}
        </div>
      </header>

      <div id="mf-answer-anchor">
        <AnswerLead answer={m.answer}>{networkFacts}</AnswerLead>
      </div>
      <RegionMap iso2={destination.iso2} className="mx-auto -my-2 hidden w-full max-w-xl text-ink sm:block" />
      <MiniAnswerBar summary={miniSummary} verified />

      <AnswerPassage question={`How much is roaming in ${destination.countryName}?`}>
        {m.answer}{esim && esim.bundles.length > 0
          ? <> An eSIM is available as an alternative — prices start from {formatPence(Math.min(...esim.bundles.map((b) => b.totalPence)))} (see comparison below). All figures are verified against official network price guides and provider store pages.</>
          : <> All figures are taken directly from the official UK network price guides and verified against published sources.</>}
      </AnswerPassage>

      <RoamingCalculator
        networks={destination.perNetwork}
        esims={esim?.bundles ?? []}
        countryName={destination.countryName}
      />

      <SavesVerdict
        amount={m.verdict === "esim" && m.savingsPence > 0 ? formatPence(m.savingsPence) : undefined}
        verdict={
          m.verdict === "esim" && m.savingsPence > 0 && m.esimChoice
            ? `An eSIM (${m.esimChoice.provider}, ${m.esimChoice.bundleName}) saves ${formatPence(m.savingsPence)} vs the cheapest network daily pass for a 7-day trip.`
            : m.verdict === "network" && m.cheapestNetwork?.included
              ? `Your network already includes roaming in ${destination.countryName} — no daily charge applies (fair-use limits apply).`
              : m.cheapestNetwork?.totalPence != null
                ? `Your network's daily pass is the best option for a 7-day trip at ${formatPence(m.cheapestNetwork.totalPence)}.`
                : `Compare options above to find the best price for your trip to ${destination.countryName}.`
        }
      />

      {esim ? (
        <AffiliateBlock slotId="esim" airportSlug={destination.countrySlug} officialUrl={esim.sourceUrl} />
      ) : null}

      <FeeGrid
        caption={`All four networks' ${destination.countryName} roaming charges (verified ${latestVerified}).`}
        columns={["Network", "Daily charge", "Pass / product name", "Fair-use note"]}
        numericColumns={[1]}
        rows={destination.perNetwork.map((n) => [
          NETWORK_LABELS[n.network] ?? n.network,
          n.included ? "Included" : n.dailyPassPence !== null ? formatPence(n.dailyPassPence) + "/day" : "No standard pass",
          n.passName ?? "—",
          n.fairUseNote ?? "—"
        ])}
      />

      <nav aria-label="Per-network detail pages" className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">Network-specific pages</h2>
        <ul className="flex flex-wrap gap-3 text-sm">
          {NETWORKS.map((network) => (
            <li key={network}>
              <Link
                href={`/roaming/${destination.countrySlug}/${network}`}
                className="font-medium text-brand-accent underline underline-offset-4"
              >
                {NETWORK_LABELS[network]} roaming in {destination.countryName} →
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
        <FaqAccordion items={faqs} />
      </section>

      <p className="text-sm">
        <Link href="/roaming" className="text-brand-accent underline underline-offset-4">
          ← All destinations
        </Link>
      </p>

      <SourcesBlock
        sources={sources}
        method="Daily roaming charges are taken from each network's official published price guide or roaming page. eSIM prices are dated snapshots from the providers' own public store pages — never from aggregators."
      />
    </article>
  );
}
