import type { Metadata } from "next";
import Link from "next/link";
import { loadRoamingDataset, loadEsimDataset, loadBaggageDataset } from "@mathfamily/data";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";

export const metadata: Metadata = {
  title: "How we verify — RoamMath methodology",
  description:
    "Exactly how RoamMath sources and keeps UK mobile roaming charges, eSIM prices and airline baggage fees current: every figure read from the network, provider or airline's own official page, date-stamped, and re-checked on a schedule.",
  alternates: { canonical: "/methodology" }
};

export default function MethodologyPage() {
  const roamingDataset = loadRoamingDataset();
  const esimDataset = loadEsimDataset();
  const baggageDataset = loadBaggageDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const destinationCount = roamingDataset.destinations.length;
  const airlineCount = baggageDataset.records.length;

  const allVerifiedDates = [
    ...roamingDataset.networkSources.map((s) => s.verifiedAt),
    ...esimDataset.records.map((r) => r.verifiedAt),
    ...baggageDataset.records.map((r) => r.verifiedAt)
  ].sort();
  const latestVerified = allVerifiedDates.at(-1) ?? roamingDataset.lastUpdated;
  const oldestVerified = allVerifiedDates[0];

  const steps = [
    {
      title: "Roaming charges come from each network's own official price guide",
      body: (
        <>
          EE, O2, Vodafone and Three daily roaming charges are read directly from each network&apos;s{" "}
          <strong>own published price guide or help page</strong> — never copied from a comparison
          site. We keep a source registry pinning each of the four networks to its official price-guide
          URL, so every daily charge and fair-use note is traceable back to where the network itself
          published it, across all {destinationCount} destinations we track.
        </>
      )
    },
    {
      title: "eSIM prices are dated snapshots from the provider's own store page",
      body: (
        <>
          Airalo, Holafly and Saily bundle prices are taken directly from each provider&apos;s own
          public store page for that country, never from an aggregator. Because these prices can move
          at any time, every bundle carries a{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.85em] font-mono">snapshotDate</code>{" "}
          — the date we last read that exact price from the provider — so you can judge for yourself
          how current it is. A small number of bundles are priced in USD and shown converted to GBP at
          an indicative rate; those are marked &ldquo;(converted)&rdquo;.
        </>
      )
    },
    {
      title: "Baggage fees are the airline's own published min–max range",
      body: (
        <>
          Cabin and checked-bag fees for the {airlineCount} airlines we track are read from that
          airline&apos;s own fee page or help centre. Most airlines price bags dynamically by route,
          date and booking channel, so we publish the official published minimum and maximum rather
          than inventing one misleading average — the range itself is sourced, not estimated.
        </>
      )
    },
    {
      title: "Each figure is date-stamped when it's verified",
      body: (
        <>
          When we confirm a figure against its official source, we record the date as{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-[0.85em] font-mono">verifiedAt</code>{" "}
          on that record. That&apos;s the date in the green &ldquo;Verified&rdquo; badge next to a
          price — it means: <em>on this date, this exact figure matched the network, provider or
          airline&apos;s own official page.</em>
        </>
      )
    },
    {
      title: "When a source blocks a simple fetch, we use a real browser — and never invent a number",
      body: (
        <>
          A handful of sources — including some airlines&apos; own fee pages — render their prices
          with JavaScript and block plain automated fetches. For those we escalate to a real rendered
          browser to read the published figure directly. If we still can&apos;t verify a number against
          an official source, we don&apos;t present it as fact: we say so on the page and link to the
          official source instead.
        </>
      )
    }
  ];

  return (
    <article className="max-w-2xl space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Methodology", url: `${siteUrl}/methodology` }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>How we verify every price</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} href={null} />
        <p className="mf-speakable text-lead text-ink">
          RoamMath&apos;s whole value is that the numbers are right. Here&apos;s exactly how every
          roaming charge, eSIM price and baggage fee is sourced, date-stamped, and kept current — so
          you can trust the figure you see.
        </p>
      </header>

      <section className="space-y-6">
        <ol className="space-y-6">
          {steps.map((step, i) => (
            <li key={step.title} className="mf-card-lg mf-edge flex gap-4 p-5">
              <span
                className="mf-num-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-sm font-bold text-brand-accent"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                <p className="text-sm text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 text-ink-muted">
        <h2 className="text-h2 font-semibold text-ink">What &ldquo;Verified [date]&rdquo; means</h2>
        <p>
          A green <strong>Verified [date]</strong> badge means that, on the date shown, the figure
          matched the network, provider or airline&apos;s own official page. If a price hasn&apos;t
          been re-checked in a while, the badge turns amber and reads{" "}
          <strong>&ldquo;Last verified&rdquo;</strong> — a signal to double-check with the source
          before you travel. Either way, the date is honest: it&apos;s the last time a human-reviewed
          check confirmed the number, not a timestamp that auto-refreshes to look current.
        </p>
        <p>
          You can always see and download the underlying data on the{" "}
          <Link href="/roaming" className="font-semibold text-brand-accent hover:underline">
            roaming charges table
          </Link>{" "}
          and the{" "}
          <Link href="/baggage-fees" className="font-semibold text-brand-accent hover:underline">
            baggage fees table
          </Link>{" "}
          — each row links to its official source.
        </p>
      </section>
    </article>
  );
}
