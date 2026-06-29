import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, OpenDataBand, PageHeading, StatStrip } from "@mathfamily/ui";
import { buildPriceIndex, dearestWorstCase } from "@/lib/content";
import { buildIframeSnippet } from "@/lib/embed";

/**
 * /press — the press & data hub. A thin KIT + coverage + contact page: it surfaces the headline
 * figures, the embeddable widget, the CSV and the citation, then points at the canonical
 * /drop-off-charges/price-index as the linkable asset. It deliberately does NOT duplicate the full
 * dataset/table (that lives once, on the Price Index) to avoid cannibalisation. NO affiliate links —
 * ParkMath is presented here as an independent data source. Every figure is read from the verified
 * dataset (no new/fabricated numbers).
 */
export const metadata: Metadata = {
  title: "Press & data — ParkMath UK airport drop-off & parking data desk",
  description:
    "Press kit and free-to-cite data for journalists: the UK Airport Drop-Off Price Index (the £28 worst-case figure), an embeddable always-current widget, the raw CSV, key figures and contact. Independent, verified, CC BY 4.0.",
  alternates: { canonical: "/press" }
};

export default function PressPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;
  const iataFor = (slug: string) => airports.get(slug)?.iata ?? "???";
  const dataset = loadDropOffDataset();
  const records = dataset.records;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/press`;
  const indexUrl = `${siteUrl}/drop-off-charges/price-index`;

  const rows = buildPriceIndex(records, nameFor, iataFor);
  const verifiedDates = records.map((r) => r.verifiedAt).sort();
  const latestVerified = verifiedDates.at(-1) ?? dataset.lastUpdated;
  const oldestVerified = verifiedDates[0];

  const charging = rows.filter((r) => !r.isFree);
  const cheapest = charging[0];
  const dearest = charging[charging.length - 1];
  const freeCount = rows.filter((r) => r.isFree).length;
  const worstPerMin = [...rows]
    .filter((r) => r.perMinutePence !== null)
    .sort((a, b) => (b.perMinutePence ?? 0) - (a.perMinutePence ?? 0))[0];
  const dearestOverstaySel = dearestWorstCase(records);
  const dearestOverstay = dearestOverstaySel
    ? rows.find((r) => r.airportSlug === dearestOverstaySel.airportSlug) ?? null
    : null;

  const fmtLongDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Press & data", url: pageUrl }
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li><a href="/" className="hover:text-brand-accent transition-colors">ParkMath</a></li>
          <li aria-hidden="true" className="text-ink-muted/50">/</li>
          <li aria-current="page" className="text-ink font-medium">Press &amp; data</li>
        </ol>
      </nav>

      <header className="space-y-3">
        <PageHeading>ParkMath Press &amp; Data</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
        <p className="text-lead text-ink">
          ParkMath is an independent data desk tracking what UK airports charge to drop off and to
          park &mdash; every figure read from the airport&apos;s own official page and date-stamped.
          The numbers below are free to quote, embed and reproduce with credit. Journalists: here is
          everything you need.
        </p>
      </header>

      {dearest && cheapest ? (
        <StatStrip
          stats={[
            ...(dearestOverstay
              ? [{ label: "Dearest drop-off (max)", value: dearestOverstay.worstCaseLabel, note: dearestOverstay.airportName }]
              : []),
            { label: "Cheapest charge", value: cheapest.fee, note: cheapest.airportName },
            ...(worstPerMin && worstPerMin.perMinutePence !== null
              ? [{ label: "Worst £/min", value: formatPence(Math.round(worstPerMin.perMinutePence)), note: worstPerMin.airportName }]
              : []),
            { label: "Drop off free", value: `${freeCount} of ${rows.length}`, note: "airports" }
          ]}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">The story right now</h2>
        <p className="text-ink">
          {dearestOverstay && dearestOverstay.hasOverstayStep ? (
            <>
              The most you can now pay to drop off at a UK airport is{" "}
              <strong className="text-ink">{dearestOverstay.worstCaseLabel}</strong> at{" "}
              {dearestOverstay.airportName} &mdash; the {dearestOverstay.fee} forecourt price is a
              teaser that steps up once you pass the included window. Meanwhile {freeCount} of{" "}
              {rows.length} major UK airports still let you drop off free.{" "}
            </>
          ) : (
            <>The full, ranked, date-stamped picture of UK airport drop-off charges in one place.{" "}</>
          )}
          The full ranked table, every figure sourced to the airport&apos;s own page, is the{" "}
          <Link href="/drop-off-charges/price-index" className="font-semibold text-brand-accent underline underline-offset-4">
            UK Airport Drop-Off Price Index
          </Link>{" "}
          &mdash; please link to it when you cite a figure.
        </p>
      </section>

      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Full dataset (CSV)" }]}
        citation={`ParkMath, "UK Airport Drop-Off Price Index 2026", verified ${latestVerified}, ${indexUrl}`}
      />

      <section className="space-y-3 rounded-lg border border-ink/10 bg-surface-muted px-4 py-4">
        <h2 className="text-h2 font-semibold text-ink">Embed the live data (free)</h2>
        <p className="text-sm text-ink-muted">
          A self-contained, always-current widget &mdash; it updates itself whenever a fee changes.
          Free to use under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" className="text-brand-accent underline underline-offset-4">CC BY 4.0</a>
          ; the credit link to ParkMath is already inside it. Paste this where you want the table to appear:
        </p>
        <pre className="overflow-x-auto rounded-md border border-ink/10 bg-white px-3 py-3 text-xs leading-relaxed text-ink dark:bg-card">
          <code>{buildIframeSnippet(siteUrl)}</code>
        </pre>
        <p className="text-xs text-ink-muted">
          <Link href="/embed" className="text-brand-accent underline underline-offset-4">
            Pick a single airport or customise the embed &rarr;
          </Link>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-semibold text-ink">Key facts you can lift</h2>
        <ul className="ml-4 list-disc space-y-1 text-sm text-ink-muted">
          {dearestOverstay && dearestOverstay.hasOverstayStep ? (
            <li>
              Dearest worst-case drop-off in the UK:{" "}
              <strong className="text-ink">{dearestOverstay.worstCaseLabel}</strong> at{" "}
              {dearestOverstay.airportName} (the {dearestOverstay.fee} forecourt price steps up past the
              included window).
            </li>
          ) : null}
          {cheapest ? (
            <li>
              Cheapest charge among airports that charge:{" "}
              <strong className="text-ink">{cheapest.fee}</strong> at {cheapest.airportName}.
            </li>
          ) : null}
          {worstPerMin && worstPerMin.perMinutePence !== null ? (
            <li>
              Worst value per minute:{" "}
              <strong className="text-ink">{formatPence(Math.round(worstPerMin.perMinutePence))}/min</strong> at{" "}
              {worstPerMin.airportName}.
            </li>
          ) : null}
          <li>
            <strong className="text-ink">{charging.length} of {rows.length}</strong> major UK airports
            charge to drop off; <strong className="text-ink">{freeCount}</strong> are still free.
          </li>
          <li>
            Every figure is the airport&apos;s own published charge, verified {fmtLongDate(latestVerified)}{" "}
            &mdash; see the{" "}
            <Link href="/methodology" className="text-brand-accent underline underline-offset-4">methodology</Link>.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-semibold text-ink">Recent coverage</h2>
        <p className="text-sm text-ink-muted">
          Coverage that cites the ParkMath index will be listed here. Featured the data and want to be
          added? Email us the link.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-ink/10 bg-surface-muted px-4 py-4 text-sm">
        <h2 className="text-base font-semibold text-ink">For journalists</h2>
        <p className="text-ink-muted">
          For comment, a custom cut of the data, or the figure for a specific airport, email{" "}
          <a href="mailto:press@parkmath.co.uk" className="text-brand-accent underline underline-offset-4">press@parkmath.co.uk</a>.
          We respond by email or message &mdash; quotes attributable to the ParkMath UK airport pricing
          data desk. The data is free to cite under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" className="text-brand-accent underline underline-offset-4">CC BY 4.0</a>{" "}
          with a link to{" "}
          <Link href="/drop-off-charges/price-index" className="text-brand-accent underline underline-offset-4">the Price Index</Link>.
        </p>
      </section>
    </article>
  );
}
