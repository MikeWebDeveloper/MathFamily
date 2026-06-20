import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";
import { avoidIndexSummary, qualifiesForAvoidPage } from "@/lib/avoid-content";

export const metadata: Metadata = {
  title: "How to avoid UK airport drop-off charges 2026 — every airport",
  description:
    "The verified free alternative at every UK airport that charges to drop off: where to park free, for how long, and how much you save. Read from official airport pages.",
  alternates: { canonical: "/avoid-drop-off-charge" }
};

export default function AvoidIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Charging airports with a verified free alternative, dearest first (biggest saving on top).
  const records = dataset.records
    .filter(qualifiesForAvoidPage)
    .sort((a, b) => (b.bands[0]?.totalPence ?? 0) - (a.bands[0]?.totalPence ?? 0));

  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;
  const oldestVerified = records.map((r) => r.verifiedAt).sort()[0];

  const rows = records.map((r) => ({
    name: airports.get(r.airportSlug)?.name ?? r.airportSlug,
    feePence: r.bands[0]?.totalPence ?? 0,
    altName: r.freeAlternative!.name
  }));

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "Avoid the drop-off charge", url: `${siteUrl}/avoid-drop-off-charge` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "How to avoid UK airport drop-off charges, biggest saving first",
          items: records.map((r) => ({
            name: `${airports.get(r.airportSlug)?.name ?? r.airportSlug} — save ${formatPence(r.bands[0]?.totalPence ?? 0)}`,
            url: `${siteUrl}/avoid-drop-off-charge/${r.airportSlug}`
          }))
        })}
      />
      <header className="space-y-3">
        <PageHeading>How to avoid UK airport drop-off charges</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
        <p className="text-lead text-ink">{avoidIndexSummary(rows)}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">Pick your airport</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {records.map((r) => {
            const a = airports.get(r.airportSlug);
            return (
              <li key={r.airportSlug}>
                <Link
                  href={`/avoid-drop-off-charge/${r.airportSlug}`}
                  className="mf-edge group flex items-center justify-between gap-4 rounded-card border bg-card p-4 transition hover:-translate-y-0.5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span>
                    <span className="block font-semibold text-ink">{a?.name ?? r.airportSlug}</span>
                    <span className="block text-sm text-ink-muted">Free: {r.freeAlternative!.name} ({r.freeAlternative!.minutesFree} min)</span>
                  </span>
                  <span className="mf-num shrink-0 rounded-full bg-positive/10 px-2.5 py-1 text-sm font-semibold text-positive">
                    save {formatPence(r.bands[0]?.totalPence ?? 0)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p>
        <Link href="/drop-off-charges" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          Compare every UK airport&apos;s drop-off charge →
        </Link>
      </p>
    </article>
  );
}
