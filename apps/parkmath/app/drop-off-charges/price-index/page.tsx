import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, newsArticleLd, tableLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, OpenDataBand, PageHeading, SourcesBlock, StatStrip } from "@mathfamily/ui";
import { buildPriceIndex, dearestWorstCase, dropOffIndexSummary } from "@/lib/content";
import { buildIframeSnippet } from "@/lib/embed";

/**
 * The UK Airport Drop-Off Price Index — the canonical, citable reference page.
 * Every figure is read straight from the verified dataset (no new/fabricated prices); each row
 * carries its own official source link + verified date. Schema is Dataset + Table + Article only
 * (NO Product/Offer — this is an independent data reference, not a merchant). NO affiliate links.
 * This is the linkable asset journalists / the Commons Library can cite verbatim.
 */
export const metadata: Metadata = {
  title: "UK Airport Drop-Off Price Index 2026 — every airport ranked, verified",
  description:
    "The UK Airport Drop-Off Price Index: every major UK airport's drop-off (kiss-and-fly) charge ranked cheapest to dearest, each figure date-stamped and sourced to the airport's own official page. Free to cite, with the raw dataset to download.",
  alternates: { canonical: "/drop-off-charges/price-index" }
};

export default function PriceIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;
  const iataFor = (slug: string) => airports.get(slug)?.iata ?? "???";
  const dataset = loadDropOffDataset();
  const records = dataset.records;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/drop-off-charges/price-index`;

  const rows = buildPriceIndex(records, nameFor, iataFor);

  // Last-updated = the most recent verified date across all rows (the dataset's freshness floor),
  // plus the oldest row date so readers see the full freshness window honestly.
  const verifiedDates = records.map((r) => r.verifiedAt).sort();
  const latestVerified = verifiedDates.at(-1) ?? dataset.lastUpdated;
  const oldestVerified = verifiedDates[0];

  // Headline figures — derived ONLY from the ranked rows above (no new prices).
  const charging = rows.filter((r) => !r.isFree);
  const cheapest = charging[0]; // rows are cheapest-first (by HEADLINE fee)
  const dearest = charging[charging.length - 1]; // dearest HEADLINE fee
  const freeCount = rows.filter((r) => r.isFree).length;
  const worstPerMin = [...rows]
    .filter((r) => r.perMinutePence !== null)
    .sort((a, b) => (b.perMinutePence ?? 0) - (a.perMinutePence ?? 0))[0];

  // The dearest WORST-CASE (max / over-stay) drop-off — the figure the headline-only ranking buried
  // (Stansted's £28 over-15-min tier, not its £10 headline). Derived honestly from the dataset
  // (last band / maxChargePence) via dearestWorstCase, then matched back to its ranked row so the
  // callout reuses the same label/source as the table and can never disagree with it.
  const dearestOverstaySel = dearestWorstCase(records);
  const dearestOverstay = dearestOverstaySel
    ? rows.find((r) => r.airportSlug === dearestOverstaySel.airportSlug) ?? null
    : null;
  // The Stansted keystone record + its ranked row — the flagship example for the wedge callout and
  // internal link. The "from 19 March 2026" fact below is read verbatim from the record's
  // penaltyNotes (never fabricated); the callout only renders when the worst case is a genuine
  // over-stay step (worstCasePence > headline) so we never overstate.
  const stanstedRecord = records.find((r) => r.airportSlug === "stansted") ?? null;
  const stanstedRow = stanstedRecord ? rows.find((r) => r.airportSlug === "stansted") ?? null : null;

  // Year-on-year movers (only rows that carry a verified prior-year figure).
  const movers = rows.filter((r) => r.yoy !== null && !r.yoy.startsWith("Unchanged"));

  const summary = dropOffIndexSummary(
    records.map((r) => ({ name: nameFor(r.airportSlug), isFree: r.isFree, feePence: r.bands[0]?.totalPence ?? 0 }))
  );

  const tableColumns = ["Rank", "Airport", "Drop-off fee", "Time included", "Max / over-stay", "£/min", "Penalty if unpaid", "Free alternative", "Verified", "Source"];

  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const fmtLongDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  // Article description — the lift-able citation sentence. Leads with the worst-case wedge (the
  // dearest over-stay drop-off the headline-only ranking hid, e.g. Stansted £28) when one exists,
  // then the cheapest charge — every figure straight from the ranked rows (no new prices).
  const articleDescription =
    `As of ${fmtLongDate(latestVerified)}, ${charging.length} of the ${rows.length} largest UK airports charge to drop a passenger off` +
    `${freeCount ? `, while ${freeCount} remain free` : ""}. ` +
    `${
      dearestOverstay && dearestOverstay.hasOverstayStep
        ? `The dearest is ${dearestOverstay.airportName} at ${dearestOverstay.worstCaseLabel} if you stay past the included window (a ${dearestOverstay.fee} forecourt teaser); `
        : dearest
          ? `The dearest headline charge is ${dearest.airportName} at ${dearest.fee}; `
          : ""
    }${cheapest ? `the cheapest charge is ${cheapest.airportName} at ${cheapest.fee}.` : ""}`;

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "UK Airport Drop-Off Price Index", url: pageUrl }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "UK Airport Drop-Off Price Index 2026",
          description: `Drop-off (kiss-and-fly) charges at ${rows.length} UK airports — headline fee, time allowance, the worst-case over-stay/max charge, £-per-minute, penalty and the free alternative — each verified against the airport's own official page and date-stamped. Free to cite and download.`,
          url: pageUrl,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath"
        })}
      />
      <JsonLd
        data={tableLd({
          about: "UK Airport Drop-Off Price Index 2026 — every airport ranked cheapest to dearest",
          url: pageUrl,
          columns: tableColumns,
          rowCount: rows.length,
          dateModified: latestVerified
        })}
      />
      <JsonLd
        data={newsArticleLd({
          headline: "UK Airport Drop-Off Price Index 2026",
          description: articleDescription,
          url: pageUrl,
          datePublished: oldestVerified ?? latestVerified,
          dateModified: latestVerified,
          sourceUrl: `${siteUrl}/methodology`,
          siteUrl,
          imageUrl: `${siteUrl}/opengraph-image`,
          publisherName: "ParkMath",
          authorName: "ParkMath",
          authorJobTitle: "UK airport pricing data desk"
        })}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li><a href="/" className="hover:text-brand-accent transition-colors">ParkMath</a></li>
          <li aria-hidden="true" className="text-ink-muted/50">/</li>
          <li><a href="/drop-off-charges" className="hover:text-brand-accent transition-colors">Drop-off charges</a></li>
          <li aria-hidden="true" className="text-ink-muted/50">/</li>
          <li aria-current="page" className="text-ink font-medium">Price Index</li>
        </ol>
      </nav>

      <header className="space-y-3">
        <PageHeading>The UK Airport Drop-Off Price Index</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
        <p className="mf-speakable text-lead text-ink">
          {articleDescription} Every figure below is read directly from each airport&apos;s own
          official drop-off page and date-stamped &mdash; cite it as &ldquo;the ParkMath UK Airport
          Drop-Off Price Index&rdquo;.
        </p>
        <p className="text-sm text-ink-muted">
          Last updated <strong className="text-ink">{fmtLongDate(latestVerified)}</strong>
          {oldestVerified && oldestVerified !== latestVerified ? (
            <> &middot; oldest row verified {fmtDate(oldestVerified)}</>
          ) : null}
          . Maintained continuously &mdash; see <Link href="#methodology" className="text-brand-accent underline underline-offset-4">how we verify</Link>.
        </p>
      </header>

      {dearest && cheapest ? (
        <StatStrip
          stats={[
            // The real headline: the dearest WORST-CASE (over-stay) drop-off in the UK — the figure
            // a headline-only ranking hides. Stansted's £28 leads, not its £10 forecourt teaser.
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

      {/* Wedge callout #1 — the data hook the headline-only ranking buried: the dearest WORST-CASE
          (over-stay / max) drop-off in the UK. Shown only when it isn't Stansted, since Stansted gets
          its own keystone callout below (no duplication). Every figure is the row's own honest
          max label + headline. */}
      {dearestOverstay &&
      dearestOverstay.hasOverstayStep &&
      dearestOverstay.airportSlug !== "stansted" ? (
        <aside className="rounded-lg border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-400/30 dark:bg-amber-400/[0.07]">
          <p className="text-ink">
            <span className="font-semibold text-ink">The headline price hides the real top fee.</span>{" "}
            The dearest worst-case UK drop-off isn&apos;t the airport with the highest{" "}
            <em>headline</em> charge &mdash; it&apos;s{" "}
            <Link
              href={`/drop-off-charges/${dearestOverstay.airportSlug}`}
              className="font-semibold text-brand-accent underline underline-offset-4 hover:opacity-80"
            >
              {dearestOverstay.airportName}
            </Link>
            , where a stay to the published maximum costs{" "}
            <strong className="text-ink">{dearestOverstay.worstCaseLabel}</strong> (the forecourt
            teaser is just {dearestOverstay.fee}). Tap the airport for the full breakdown.
          </p>
        </aside>
      ) : null}

      {/* Wedge callout #2 — the Stansted keystone / press hook, surfaced whenever Stansted carries a
          genuine over-stay step (its £10 headline → £28 over-15-min tier), independent of who tops
          the max ranking. The £28 and the "from 19 March 2026" fact are read verbatim from the
          dataset (row label + penaltyNotes), never fabricated. This is the flagship internal link to
          the Stansted keystone. */}
      {stanstedRow && stanstedRecord && stanstedRow.hasOverstayStep ? (
        <aside className="rounded-lg border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-400/30 dark:bg-amber-400/[0.07]">
          <p className="text-ink">
            <span className="font-semibold text-ink">
              {stanstedRow.airportName} now charges {stanstedRow.worstCaseLabel} to drop off.
            </span>{" "}
            The {stanstedRow.fee} forecourt teaser
            {stanstedRow.timeLabel ? ` (up to ${stanstedRow.timeLabel})` : ""} steps up to{" "}
            <strong className="text-ink">{stanstedRow.worstCaseLabel}</strong> for stays over the
            included window
            {stanstedRecord.penaltyNotes && /19 March 2026/.test(stanstedRecord.penaltyNotes)
              ? " (from 19 March 2026)"
              : ""}
            , while most guides still quote the old figure.{" "}
            <Link
              href="/drop-off-charges/stansted"
              className="font-semibold text-brand-accent underline underline-offset-4 hover:opacity-80"
            >
              See the full Stansted drop-off breakdown →
            </Link>
          </p>
        </aside>
      ) : null}

      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Full dataset (CSV)" }]}
        citation={`ParkMath, "UK Airport Drop-Off Price Index 2026", verified ${latestVerified}, ${siteUrl}/drop-off-charges/price-index`}
      />

      {/* Passive backlink asset — surfaces the EXISTING /embed/drop-off-charges widget. The iframe
          serves a self-contained doc with the ParkMath attribution baked in, so every embed is an
          evergreen credit link. Snippet is rendered as escaped TEXT (JSX escapes it inside <code>),
          never injected as raw HTML. */}
      <section className="space-y-3 rounded-lg border border-ink/10 bg-surface-muted px-4 py-4">
        <h2 className="text-h2 font-semibold text-ink">Embed this price index (free)</h2>
        <p className="text-sm text-ink-muted">
          Free to embed and always current &mdash; just credit ParkMath with a link back (the
          attribution is already inside the widget). Paste this snippet where you want the table to
          appear:
        </p>
        <pre className="overflow-x-auto rounded-md border border-ink/10 bg-white px-3 py-3 text-xs leading-relaxed text-ink dark:bg-card">
          <code>{buildIframeSnippet(siteUrl)}</code>
        </pre>
        <p className="text-xs text-ink-muted">
          Select all and copy.{" "}
          <Link href="/embed" className="text-brand-accent underline underline-offset-4">
            Pick a single airport or customise the embed →
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">The full index — every UK airport, cheapest to dearest</h2>
        <p className="text-sm text-ink-muted">
          {summary} Ranked by the headline (standard) drop-off fee. Free airports lead the table; flat
          per-entry tariffs show &ldquo;Per entry&rdquo; rather than a per-minute figure. Tap any
          source link to open that airport&apos;s own page.
        </p>
        {/* Mobile card view — rank, airport, fee only */}
        <div className="md:hidden space-y-2">
          {rows.map((r) => (
            <div key={r.airportSlug} className="flex items-center justify-between gap-3 rounded-lg border border-ink/8 bg-card px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-medium text-ink-muted w-5 shrink-0">{r.rank}</span>
                <Link href={`/drop-off-charges/${r.airportSlug}`} className="font-medium text-brand-accent underline underline-offset-4 hover:opacity-80 truncate">
                  {r.airportName}
                </Link>
              </div>
              <span className="mf-num font-bold text-ink shrink-0 text-base">{r.fee}</span>
            </div>
          ))}
          <p className="text-xs text-ink-muted">Showing fee only. View full table on a wider screen or tap an airport for complete details.</p>
        </div>

        {/* Desktop full table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-ink/10">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">
              UK Airport Drop-Off Price Index 2026 — every UK airport ranked cheapest to dearest, each
              figure verified against the airport&apos;s official page and date-stamped.
            </caption>
            <thead>
              <tr className="border-b border-ink/15 bg-surface-muted text-left">
                <th scope="col" className="px-3 py-2 font-semibold text-ink">#</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Airport</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Drop-off fee</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Time included</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Max / over-stay</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">£/min</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Penalty if unpaid</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Free alternative</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Verified</th>
                <th scope="col" className="px-3 py-2 font-semibold text-ink">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.airportSlug} className="border-b border-ink/8 last:border-0 hover:bg-surface-muted/50">
                  <td className="px-3 py-2 tabular-nums text-ink-muted">{r.rank}</td>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-ink">
                    <Link href={`/drop-off-charges/${r.airportSlug}`} className="text-brand-accent underline underline-offset-4 hover:opacity-80">
                      {r.airportName}
                    </Link>{" "}
                    <span className="font-mono text-xs text-ink-muted">{r.iata}</span>
                  </th>
                  <td className="px-3 py-2 font-semibold tabular-nums text-ink">{r.fee}</td>
                  <td className="px-3 py-2 tabular-nums text-ink-muted">{r.timeLabel}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {r.hasOverstayStep ? (
                      <span className="font-semibold text-amber-700 dark:text-amber-400" title="Dearest published tier — costs more than the headline if you stay past the included window">
                        {r.worstCaseLabel}
                      </span>
                    ) : (
                      <span className="text-ink-muted">{r.worstCaseLabel}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-ink-muted">{r.perMinLabel}</td>
                  <td className="px-3 py-2 tabular-nums text-ink-muted">{r.penaltyLabel}</td>
                  <td className="px-3 py-2 text-ink-muted">{r.freeAlternative}</td>
                  <td className="px-3 py-2 tabular-nums text-ink-muted">
                    <time dateTime={r.verifiedAt}>{fmtDate(r.verifiedAt)}</time>
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener nofollow"
                      className="text-brand-accent underline underline-offset-4 hover:opacity-80"
                    >
                      Official page<span className="sr-only"> for {r.airportName} (opens the airport&apos;s own drop-off page)</span> ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-muted">
          &ldquo;Drop-off fee&rdquo; is the standard headline charge for the shortest paid stay.
          &ldquo;Max / over-stay&rdquo; is the dearest amount the airport itself publishes for the
          drop-off forecourt &mdash; the highest tariff band, or its stated maximum charge where one is
          given (highlighted where it&apos;s dearer than the headline, e.g. Stansted&apos;s £28 over-15-min
          step). It is read straight from the dataset, never extrapolated. Per-minute overstay rates and
          Blue Badge concessions are covered on each airport&apos;s own page. £/min is the headline fee
          divided by the minutes it buys (shown only for time-based tariffs).
        </p>
      </section>

      {movers.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-h2 font-semibold text-ink">Year-on-year movers</h2>
          <p className="text-sm text-ink-muted">
            Where we hold a verified prior-year price, here is how the drop-off charge has moved into 2026:
          </p>
          <ul className="space-y-1 text-sm text-ink-muted">
            {movers.map((m) => (
              <li key={m.airportSlug}>
                <Link href={`/drop-off-charges/${m.airportSlug}`} className="font-medium text-ink underline underline-offset-4 hover:text-brand-accent">
                  {m.airportName}
                </Link>
                : {m.yoy}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="methodology" className="space-y-2 rounded-lg border border-ink/10 bg-surface-muted px-4 py-4 text-sm">
        <h2 className="text-h2 font-semibold text-ink">How we verify (methodology)</h2>
        <p className="text-ink-muted">
          Every fee in this index is read directly from the airport&apos;s own official drop-off /
          &ldquo;dropping off&rdquo; page &mdash; never from a third-party aggregator, money-saving
          page or our own memory. Each row records the exact date we last checked it (the
          &ldquo;Verified&rdquo; column) and links to the source we read. We re-check the dataset on a
          rolling basis and never republish a price we haven&apos;t confirmed, which is why some figures
          here differ from older guides still quoting last year&apos;s charge.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-ink-muted">
          <li>Figures are the published standard drop-off charge in pounds sterling, current for 2026.</li>
          <li>&ldquo;Free alternative&rdquo; is a free option named on the airport&apos;s own page (a free waiting car park, or rail/tram reaching the terminal) &mdash; not an off-site third party.</li>
          <li>The full machine-readable dataset is free to download (CSV) and free to cite. Attribution: &ldquo;ParkMath UK Airport Drop-Off Price Index&rdquo; with a link to this page.</li>
          <li>Found a fee that has changed? It is corrected here within days. See our full <Link href="/methodology" className="text-brand-accent underline underline-offset-4">verification method</Link>.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">Go deeper</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link href="/drop-off-charges" className="text-brand-accent underline underline-offset-4">
              Sortable league table: filter every UK airport drop-off charge by fee or £/min →
            </Link>
          </li>
          <li>
            <Link href="/parking-vs-drop-off" className="text-brand-accent underline underline-offset-4">
              Park or get dropped off? Which is cheaper at every UK airport →
            </Link>
          </li>
          <li>
            <Link href="/airport-parking-options" className="text-brand-accent underline underline-offset-4">
              Cheapest way in and out of each airport: drop-off vs parking, compared →
            </Link>
          </li>
          <li>
            <Link href="/parking-price-index-2026" className="text-brand-accent underline underline-offset-4">
              The 2026 UK airport parking price index →
            </Link>
          </li>
          <li>
            <Link href="/embed" className="text-brand-accent underline underline-offset-4">
              Embed this always-current data on your own site (free) →
            </Link>
          </li>
        </ul>
      </section>

      <SourcesBlock
        sources={[{ label: "Each airport's official drop-off page (linked per row above)", url: `${siteUrl}/drop-off-charges`, verifiedAt: latestVerified }]}
        method="Every figure is each airport's own officially published drop-off charge, read from the source linked in its row and re-verified on the date shown. Nothing is scraped from third-party aggregators; nothing is republished unverified."
      />
    </article>
  );
}
