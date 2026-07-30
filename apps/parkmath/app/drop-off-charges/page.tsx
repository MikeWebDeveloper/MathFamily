import type { Metadata } from "next";
import Link from "next/link";
import { isPublicTransportAlt, loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, datasetLd, itemListLd, JsonLd, speakableLd, tableLd } from "@mathfamily/geo";
import { AnswerPassage, FreshnessBadge, OpenDataBand, PageHeading, StatStrip } from "@mathfamily/ui";
import { buildDropOffLeague, dropOffHubAnswer, dropOffIndexSummary, dropOffPerMinutePence, dropOffWorstCasePence, isPerEntryTariff } from "@/lib/content";
import { SortableFeeTable, type DropOffRow } from "@/components/sortable-fee-table";
import { DropOffLeagueTable } from "@/components/dropoff-league-table";
import { HubBookingCta } from "@/components/hub-booking-cta";

export const metadata: Metadata = {
  title: "UK airport drop-off charges 2026 — all airports compared (verified)",
  description:
    "Every major UK airport's drop-off (kiss-and-fly) charge for 2026 in one sortable table: fee, time window, £-per-minute, penalty and the free alternative — each verified against the airport's own official page. The only all-airports league table that's actually current.",
  alternates: { canonical: "/drop-off-charges" }
};

export default function MasterTablePage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const nameFor = (slug: string) => airports.get(slug)?.name ?? slug;

  // SSR default: most expensive first (matches "fee" sort key)
  const records = [...dataset.records].sort(
    (a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0)
  );
  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;
  const oldestVerified = records.map((r) => r.verifiedAt).sort()[0];

  const league = buildDropOffLeague(records, nameFor);
  const hubAnswer = dropOffHubAnswer(league, latestVerified);

  // Most-searched drop-off pages (curated): point concentrated internal-link equity from this
  // high-authority hub at the airports with the most real search demand, using natural
  // "[airport] drop-off charge" anchor text. Resolved from the dataset (never hardcoded) and
  // rendered only when the record exists, so it stays correct if data changes.
  // liverpool + prestwick added (2026-07-12 striking-distance pass): GSC shows this exact page
  // (/drop-off-charges/[slug]) is already the one Google ranks for both — Liverpool at an 11-query
  // striking-distance cluster averaging pos ~8.95, Prestwick averaging pos ~7.25 (the closest
  // page-1-adjacent page on the whole site) — so they get the same concentrated hub-link treatment
  // as stansted/southend/bristol rather than sitting only in the undifferentiated A-Z list below.
  const featuredSlugs = ["stansted", "southend", "bristol", "liverpool", "prestwick"];
  const featured = featuredSlugs
    .map((slug) => records.find((r) => r.airportSlug === slug))
    .filter((r): r is (typeof records)[number] => Boolean(r))
    .map((r) => ({
      slug: r.airportSlug,
      name: nameFor(r.airportSlug),
      fee: r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0)
    }));

  // Major-airport reinforcement (2026-07-03 indexing census): birmingham/gatwick/manchester/luton/
  // edinburgh/glasgow were the worst-indexed drop-off-charges pages (8/14 sampled), all missing a
  // homepage/hub referrer at last crawl. The "Per-airport drop-off guides" list further down already
  // links every airport, but every entry there gets identical, undifferentiated link weight — these
  // six big airports get no concentrated signal the way stansted/southend/bristol do above. This
  // strip adds that concentration without touching the existing curated "most-searched" set or the
  // full A-Z list. Resolved from the dataset only (never hardcoded away from what actually exists).
  const majorAirportSlugs = ["birmingham", "gatwick", "manchester", "luton", "edinburgh", "glasgow"];
  const majorAirports = majorAirportSlugs
    .map((slug) => records.find((r) => r.airportSlug === slug))
    .filter((r): r is (typeof records)[number] => Boolean(r))
    .map((r) => ({
      slug: r.airportSlug,
      name: nameFor(r.airportSlug),
      fee: r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0)
    }));

  // Stansted keystone wedge — the flagship example for the hub's body-level internal link. The
  // £28 worst-case is read honestly from the dataset (dropOffWorstCasePence → last band /
  // maxChargePence) and the "from 19 March 2026" fact verbatim from penaltyNotes; renders only when
  // a genuine over-stay step exists, so it never overstates.
  const stanstedRecord = records.find((r) => r.airportSlug === "stansted") ?? null;
  const stanstedHeadlinePence = stanstedRecord && !stanstedRecord.isFree ? stanstedRecord.bands[0]?.totalPence ?? 0 : 0;
  const stanstedWorstPence = stanstedRecord ? dropOffWorstCasePence(stanstedRecord) : null;
  const stanstedWedge =
    stanstedRecord && stanstedWorstPence !== null && stanstedWorstPence > stanstedHeadlinePence
      ? {
          name: nameFor("stansted"),
          headline: formatPence(stanstedHeadlinePence),
          worst: formatPence(stanstedWorstPence),
          timeIncluded: stanstedRecord.bands[0]?.upToMinutes ?? null,
          effectiveDate:
            stanstedRecord.penaltyNotes && /19 March 2026/.test(stanstedRecord.penaltyNotes)
              ? "19 March 2026"
              : null
        }
      : null;

  // Headline stats for the strip (the data-PR "most & least expensive" hook).
  const charging = league.filter((e) => !e.isFree);
  const byFee = [...charging].sort((a, b) => a.feePence - b.feePence);
  const cheapest = byFee[0];
  const dearest = byFee[byFee.length - 1];
  const worstPerMin = league.find((e) => e.perMinutePence !== null);
  const freeCount = league.filter((e) => e.isFree).length;

  const rows: DropOffRow[] = records.map((r) => {
    const airport = airports.get(r.airportSlug);
    const perMinPence = dropOffPerMinutePence(r);
    return {
      airportSlug: r.airportSlug,
      airportName: airport?.name ?? r.airportSlug,
      iata: airport?.iata ?? "???",
      feePence: r.isFree ? 0 : (r.bands[0]?.totalPence ?? 0),
      perMinutePence: perMinPence,
      fee: r.isFree ? "Free" : formatPence(r.bands[0]?.totalPence ?? 0),
      perMin: perMinPence !== null ? `${formatPence(Math.round(perMinPence))}/min` : r.isFree ? "Free" : "Flat",
      timeLimit: r.isFree ? "—" : isPerEntryTariff(r) ? "Per entry" : `${r.bands[0]?.upToMinutes ?? "—"} min`,
      penalty: r.penaltyPence !== null ? formatPence(r.penaltyPence) : "—",
      freeAlt: r.freeAlternative ? (isPublicTransportAlt(r.freeAlternative) ? `${r.freeAlternative.name} (public transport)` : `${r.freeAlternative.name} (${r.freeAlternative.minutesFree} min)`) : "—",
      sourceUrl: r.sourceUrl,
      verifiedAt: r.verifiedAt
    };
  });

  const tableColumns = ["Airport", "Fee", "£/min", "Time limit", "Penalty", "Free alternative", "Verified"];

  return (
    <article className="space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` }
        ])}
      />
      <JsonLd
        data={datasetLd({
          name: "UK airport drop-off charges 2026",
          description: `Drop-off fees, time limits, £-per-minute, penalties and free alternatives at ${records.length} UK airports, each verified against the airport's official page.`,
          url: `${siteUrl}/drop-off-charges`,
          dateModified: latestVerified,
          siteUrl,
          creatorName: "ParkMath",
          license: "https://creativecommons.org/licenses/by/4.0/"
        })}
      />
      <JsonLd
        data={tableLd({
          about: "UK airport drop-off charges 2026, compared",
          url: `${siteUrl}/drop-off-charges`,
          columns: tableColumns,
          rowCount: records.length,
          dateModified: latestVerified
        })}
      />
      <JsonLd
        data={itemListLd({
          name: "UK airport drop-off charges, highest first",
          items: records.map((r) => ({
            name: `${nameFor(r.airportSlug)} — ${r.isFree ? "free" : formatPence(r.bands[0]?.totalPence ?? 0)}`,
            url: `${siteUrl}/drop-off-charges/${r.airportSlug}`
          }))
        })}
      />
      {/* AI-visibility pilot (2026-07-02, escalations/2026-06-30-ai-visibility.todo.md query 1:
          "uk airport drop off fees" — AIO renders but ParkMath isn't cited). The passage below was
          already speakable-classed but had no matching JSON-LD, so the markup was inert for
          extraction; this makes it real. */}
      <JsonLd data={speakableLd({ url: `${siteUrl}/drop-off-charges` })} />

      <header className="space-y-3">
        <PageHeading>UK airport drop-off charges, compared (2026)</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
      </header>

      <AnswerPassage question="What are the UK airport drop-off fees?">{hubAnswer}</AnswerPassage>

      {dearest && cheapest ? (
        <StatStrip
          stats={[
            { label: "Most expensive", value: formatPence(dearest.feePence), note: dearest.name },
            { label: "Cheapest charge", value: formatPence(cheapest.feePence), note: cheapest.name },
            ...(worstPerMin && worstPerMin.perMinutePence !== null
              ? [{ label: "Worst £/min", value: `${formatPence(Math.round(worstPerMin.perMinutePence))}`, note: worstPerMin.name }]
              : []),
            { label: "Drop off free", value: `${freeCount} of ${league.length}`, note: "airports" }
          ]}
        />
      ) : null}

      <OpenDataBand
        downloads={[{ href: "/data/drop-off-charges.csv", label: "Drop-off charges (CSV)" }]}
        citation={`ParkMath, "UK airport drop-off charges 2026", verified ${latestVerified}, parkmath.co.uk`}
      />

      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 bg-surface-muted px-4 py-3 text-sm">
        <p className="text-ink-muted">
          <span className="font-semibold text-ink">Citing these figures?</span> The ranked, date-stamped
          reference is the{" "}
          <Link href="/drop-off-charges/price-index" className="text-brand-accent underline underline-offset-4">
            UK Airport Drop-Off Price Index
          </Link>{" "}
          — every airport, cheapest to dearest, each fee sourced to its official page.
        </p>
        <Link
          href="/drop-off-charges/price-index"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-brand-accent/40 px-3 py-1.5 font-semibold text-brand-accent hover:bg-brand-accent/5"
        >
          Open the Price Index →
        </Link>
      </aside>

      {featured.length > 0 ? (
        <section className="space-y-2" aria-label="Most-searched airport drop-off charges">
          <h2 className="text-base font-semibold text-ink">Most-searched drop-off charges</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {featured.map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/drop-off-charges/${f.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/[0.04] px-3 py-1.5 font-medium text-brand-accent hover:bg-brand-accent/10"
                >
                  {f.name} drop-off charge
                  <span className="text-xs font-normal text-ink-muted">{f.fee}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {majorAirports.length > 0 ? (
        <section className="space-y-2" aria-label="Major UK airport drop-off charges">
          <h2 className="text-base font-semibold text-ink">Major UK airports</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {majorAirports.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/drop-off-charges/${a.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-surface-muted px-3 py-1.5 font-medium text-ink hover:border-brand-accent/40 hover:text-brand-accent"
                >
                  {a.name} drop-off charge
                  <span className="text-xs font-normal text-ink-muted">{a.fee}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stanstedWedge ? (
        <aside className="rounded-lg border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-400/30 dark:bg-amber-400/[0.07]">
          <p className="text-ink">
            <span className="font-semibold text-ink">
              {stanstedWedge.name} now charges {stanstedWedge.worst} to drop off.
            </span>{" "}
            The {stanstedWedge.headline} forecourt teaser
            {stanstedWedge.timeIncluded ? ` (up to ${stanstedWedge.timeIncluded} minutes)` : ""} steps up to{" "}
            <strong className="text-ink">{stanstedWedge.worst}</strong> for longer stays
            {stanstedWedge.effectiveDate ? ` from ${stanstedWedge.effectiveDate}` : ""} &mdash; while
            most guides still quote the old figure.{" "}
            <Link href="/drop-off-charges/stansted" className="font-semibold text-brand-accent underline underline-offset-4 hover:opacity-80">
              See the full Stansted drop-off breakdown →
            </Link>
          </p>
        </aside>
      ) : null}

      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-accent/25 bg-blue-50/60 px-4 py-3 text-sm dark:bg-brand-accent/[0.06] dark:border-brand-accent/20">
        <p className="text-ink-muted">
          <span className="font-semibold text-ink">Run a site or blog?</span> Embed this always-current
          table for free — it updates itself whenever a fee changes.
        </p>
        <Link
          href="/embed"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-brand-accent/40 px-3 py-1.5 font-semibold text-brand-accent hover:bg-brand-accent/5"
        >
          Get the embed code →
        </Link>
      </aside>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">Every UK airport, compared</h2>
        <p className="text-sm text-ink-muted">
          {dropOffIndexSummary(
            records.map((r) => ({ name: nameFor(r.airportSlug), isFree: r.isFree, feePence: r.bands[0]?.totalPence ?? 0 }))
          )}{" "}
          Sort by headline fee, by cost per minute, or A–Z. The aggregators and money pages get these wrong; every
          row here links to the airport&apos;s own page and shows the date we last checked it.
        </p>
        <SortableFeeTable rows={rows} />
      </section>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">The £-per-minute league table: most &amp; least expensive to drop off</h2>
        <AnswerPassage question="Which UK airport is the worst value to drop off at, per minute?">
          {worstPerMin && worstPerMin.perMinutePence !== null ? (
            <>
              You aren&apos;t really charged per drop-off — you&apos;re charged per minute of allowance. On that basis the
              worst value in the UK is <strong>{worstPerMin.name}</strong> at {formatPence(Math.round(worstPerMin.perMinutePence))} a
              minute ({formatPence(worstPerMin.feePence)} for up to {worstPerMin.minutes} minutes). The table below ranks
              every airport by effective cost per minute; flat per-entry charges (like Heathrow&apos;s) and the free airports
              sit at the bottom because there&apos;s no honest per-minute figure for them.
            </>
          ) : (
            <>Every airport&apos;s effective cost per minute of drop-off allowance, ranked worst-value first.</>
          )}
        </AnswerPassage>
        <DropOffLeagueTable league={league} />
      </section>

      {/* Affiliate CTA — visually subordinate to the data table above. Fails closed (renders nothing
          when no live affiliate link exists), routes through the tracked /go redirect, carries the
          "Ad" disclosure + the neutrality line. Reuses resolveHeProduct/goLink — no hardcoded URL. */}
      <HubBookingCta league={league} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">Per-airport drop-off guides</h2>
        <p className="text-sm text-ink-muted">
          Full breakdown for each airport — the exact fee, time bands, penalty, payment deadline, Blue Badge rules and the
          free alternative, all date-stamped against the official source:
        </p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {[...records]
            .sort((a, b) => nameFor(a.airportSlug).localeCompare(nameFor(b.airportSlug)))
            .map((r) => (
              <li key={r.airportSlug}>
                <Link
                  href={`/drop-off-charges/${r.airportSlug}`}
                  className="text-brand-accent underline underline-offset-4 hover:opacity-80"
                >
                  {nameFor(r.airportSlug)} drop-off charges →
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">Parking for the trip, not just dropping off?</h2>
        <p className="text-sm text-ink-muted">
          See the cheapest way in and out of each airport — drop-off, the free alternative, drive-up gate parking, Park &amp;
          Ride and Meet &amp; Greet, compared neutrally:{" "}
          <Link href="/airport-parking-options" className="text-brand-accent underline underline-offset-4">
            UK airport parking options compared →
          </Link>
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-ink/10 bg-surface-muted px-4 py-3 text-sm">
        <h2 className="text-base font-semibold text-ink">How we keep this current</h2>
        <p className="text-ink-muted">
          Each row is read directly from the airport&apos;s own official drop-off page and re-verified on the date shown — tap
          the ✓ in any row to open that source. We never republish a price we haven&apos;t checked, which is why the figures
          here differ from the older aggregator and money-saving pages. Found a fee that&apos;s changed? It&apos;ll be reflected
          here within days. For the ranked, citable reference see the{" "}
          <Link href="/drop-off-charges/price-index" className="text-brand-accent underline underline-offset-4">
            UK Airport Drop-Off Price Index
          </Link>{" "}
          or our{" "}
          <Link href="/parking-price-index-2026" className="text-brand-accent underline underline-offset-4">
            2026 UK airport parking price index
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
