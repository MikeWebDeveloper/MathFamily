import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, JsonLd, tableLd } from "@mathfamily/geo";
import { AnswerPassage, FreshnessBadge, OpenDataBand, PageHeading, SourcesBlock, StatStrip } from "@mathfamily/ui";
import { buildDropOffLeague } from "@/lib/content";
import { DropOffLeagueTable } from "@/components/dropoff-league-table";

export const metadata: Metadata = {
  title: "UK airport drop-off charges ranked by cost per minute (2026)",
  description:
    "Which UK airport punishes you most per minute of a goodbye? Every major UK airport's drop-off charge ranked by pence per minute of allowance — verified against official sources, 2026.",
  alternates: { canonical: "/airport-drop-off-league-table" }
};

export default function DropOffLeagueTablePage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;

  const records = dataset.records;
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;

  const league = buildDropOffLeague(records, nameFor);

  const perMinEntries = league.filter((e) => e.perMinutePence !== null);
  const worstPerMin = perMinEntries[0];
  const bestPerMin = perMinEntries[perMinEntries.length - 1];
  const freeCount = league.filter((e) => e.isFree).length;
  const charging = league.filter((e) => !e.isFree);
  const byFee = [...charging].sort((a, b) => a.feePence - b.feePence);
  const cheapestFee = byFee[0];
  const dearestFee = byFee[byFee.length - 1];

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "League table", url: `${siteUrl}/airport-drop-off-league-table` }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "UK airport drop-off charges ranked by cost per minute 2026",
          description: `Every major UK airport's drop-off charge ranked by pence per minute of allowance, verified against official sources.`,
          url: `${siteUrl}/airport-drop-off-league-table`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath",
          distribution: {
            encodingFormat: "text/csv",
            contentUrl: `${siteUrl}/data/drop-off-charges.csv`
          }
        })}
      />
      <JsonLd
        data={tableLd({
          about: "UK airport drop-off charges ranked by cost per minute 2026",
          url: `${siteUrl}/airport-drop-off-league-table`,
          columns: ["Rank", "Airport", "£ per minute", "Headline fee", "Time you get"],
          rowCount: league.length,
          dateModified: latestVerified
        })}
      />

      <header className="space-y-3">
        <PageHeading>UK airport drop-off charges ranked by cost per minute (2026)</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} />
        <p className="mf-speakable text-lead text-ink">
          You aren&apos;t really charged per drop-off — you&apos;re charged per minute of allowance.
          {worstPerMin && worstPerMin.perMinutePence !== null
            ? ` The worst value in the UK is ${worstPerMin.name} at ${formatPence(Math.round(worstPerMin.perMinutePence))}/min (${formatPence(worstPerMin.feePence)} for up to ${worstPerMin.minutes} minutes).`
            : ""}
          {bestPerMin && bestPerMin.perMinutePence !== null
            ? ` The best value time-based tariff is ${bestPerMin.name} at ${formatPence(Math.round(bestPerMin.perMinutePence))}/min.`
            : ""}
          {` ${freeCount} airport${freeCount !== 1 ? "s" : ""} still let${freeCount === 1 ? "s" : ""} you drop off free.`}
          {" Every figure is read from the airport's own official page and date-stamped below."}
        </p>
      </header>

      {worstPerMin && bestPerMin && dearestFee && cheapestFee ? (
        <StatStrip
          stats={[
            ...(worstPerMin.perMinutePence !== null
              ? [{ label: "Worst £/min", value: `${formatPence(Math.round(worstPerMin.perMinutePence))}/min`, note: worstPerMin.name }]
              : []),
            ...(bestPerMin.perMinutePence !== null
              ? [{ label: "Best £/min", value: `${formatPence(Math.round(bestPerMin.perMinutePence))}/min`, note: bestPerMin.name }]
              : []),
            { label: "Highest fee", value: formatPence(dearestFee.feePence), note: dearestFee.name },
            { label: "Drop off free", value: `${freeCount} of ${league.length}`, note: "airports" }
          ]}
        />
      ) : null}

      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" }]}
        citation={`ParkMath, "UK airport drop-off charges ranked by cost per minute 2026", verified ${latestVerified}, parkmath.co.uk`}
      />

      <AnswerPassage question="Which UK airport is the worst value to drop off at, per minute?">
        {worstPerMin && worstPerMin.perMinutePence !== null ? (
          <>
            Measured per minute of allowance, the worst value in the UK is <strong>{worstPerMin.name}</strong> at{" "}
            {formatPence(Math.round(worstPerMin.perMinutePence))} a minute ({formatPence(worstPerMin.feePence)} for up to{" "}
            {worstPerMin.minutes} minutes). Flat per-entry charges (where the charge is the same however briefly you stop)
            and free airports are shown at the bottom of the table — there is no honest per-minute figure for them. Every
            figure is read from the airport&apos;s own official page and verified {latestVerified}.
          </>
        ) : (
          <>Every airport&apos;s effective cost per minute of drop-off allowance, ranked worst-value first.</>
        )}
      </AnswerPassage>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">The league table: all UK airports ranked</h2>
        <DropOffLeagueTable league={league} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">Related guides</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href="/drop-off-charges" className="text-brand-accent underline underline-offset-4">
              All UK airport drop-off charges in one table →
            </Link>
          </li>
          <li>
            <Link href="/parking-price-index-2026" className="text-brand-accent underline underline-offset-4">
              UK airport parking &amp; drop-off price index 2026 →
            </Link>
          </li>
          <li>
            <Link href="/avoid-drop-off-charge" className="text-brand-accent underline underline-offset-4">
              How to avoid the charge at every UK airport →
            </Link>
          </li>
        </ul>
      </section>

      <SourcesBlock
        sources={[{ label: "Official UK airport drop-off pages", url: `${siteUrl}/drop-off-charges`, verifiedAt: latestVerified }]}
        method="Every figure is read from each airport's own official drop-off page and re-verified on the date shown. The per-minute figure is exact arithmetic (headline fee ÷ headline time limit) — we never fabricate a rate."
      />
    </article>
  );
}
