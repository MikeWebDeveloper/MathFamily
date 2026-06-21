import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, faqPageLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { FreshnessBadge, PageHeading } from "@mathfamily/ui";
import {
  blueBadgeIndexRow,
  blueBadgeIndexSummary,
  blueBadgeSortRank,
  qualifiesForBlueBadgePage,
  type BlueBadgeIndexRow
} from "@/lib/blue-badge-content";

export const metadata: Metadata = {
  title: "Blue Badge airport drop-off 2026 — is it free at every UK airport?",
  description:
    "Blue Badge drop-off at every UK airport: where the charge is waived, where there's a free window, where there's only a concession, and where nothing is published — each read from the airport's own page.",
  alternates: { canonical: "/blue-badge" }
};

const STATUS_PILL: Record<BlueBadgeIndexRow["kind"], string> = {
  exempt: "bg-positive/10 text-positive",
  "free-window": "bg-brand-accent/10 text-brand-accent",
  reduced: "bg-warning/10 text-warning",
  none: "bg-ink-muted/10 text-ink-muted"
};

export default function BlueBadgeIndexPage() {
  const airports = new Map(loadAirports().map((a) => [a.slug, a]));
  const dataset = loadDropOffDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const records = dataset.records.filter(qualifiesForBlueBadgePage);
  const rows: BlueBadgeIndexRow[] = records
    .map((r) => blueBadgeIndexRow(r, airports.get(r.airportSlug)?.name ?? r.airportSlug))
    .sort((a, b) => blueBadgeSortRank(a) - blueBadgeSortRank(b) || a.name.localeCompare(b.name));

  const latestVerified = records.map((r) => r.verifiedAt).sort().at(-1) ?? dataset.lastUpdated;
  const oldestVerified = records.map((r) => r.verifiedAt).sort()[0];

  const faqs = [
    {
      question: "Do Blue Badge holders get free airport drop-off in the UK?",
      answer: blueBadgeIndexSummary(rows) + " There is no single national rule — each airport sets its own policy, so check the airport you're using."
    },
    {
      question: "Which UK airports waive the drop-off charge for Blue Badge holders?",
      answer:
        (() => {
          const exempt = rows.filter((r) => !r.isFree && r.kind === "exempt").map((r) => r.name);
          return exempt.length
            ? `${exempt.join(", ")} waive the charge for registered Blue Badge holders (verified ${latestVerified}). Most other airports instead offer a free time window in a named car park, or only a concession.`
            : "No tracked UK airport currently waives the charge outright; most offer a free window in a named car park instead.";
        })()
    }
  ];

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Blue Badge & accessibility", url: `${siteUrl}/blue-badge` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "Blue Badge airport drop-off policy by UK airport",
          items: rows.map((r) => ({
            name: `${r.name} — ${r.statusLabel}`,
            url: `${siteUrl}/blue-badge/${r.slug}`
          }))
        })}
      />
      <JsonLd data={faqPageLd(faqs)} />

      <header className="space-y-3">
        <PageHeading>Blue Badge airport drop-off in the UK</PageHeading>
        <FreshnessBadge verifiedAt={latestVerified} oldestRowDate={oldestVerified} />
        <p className="text-lead text-ink mf-speakable">{blueBadgeIndexSummary(rows)}</p>
        <p className="text-sm text-ink-muted">
          There is no national rule — each airport sets its own Blue Badge drop-off policy. Every line below is read
          verbatim from that airport&apos;s own page; we classify the outcome only from the published wording and never
          invent a concession.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-ink">Pick your airport</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const a = airports.get(r.slug);
            return (
              <li key={r.slug}>
                <Link
                  href={`/blue-badge/${r.slug}`}
                  className="mf-edge group flex items-center justify-between gap-4 rounded-card border bg-card p-4 transition hover:-translate-y-0.5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span>
                    <span className="block font-semibold text-ink">{a?.name ?? r.slug}</span>
                    <span className="block text-sm text-ink-muted">
                      {r.isFree
                        ? "Free drop-off for everyone"
                        : r.feePence !== null
                          ? `Standard charge: ${formatPence(r.feePence)}`
                          : "See the policy"}
                    </span>
                  </span>
                  <span className={`mf-num shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[r.kind]}`}>
                    {r.statusLabel}
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
      <p>
        <Link href="/avoid-drop-off-charge" className="text-sm font-medium text-brand-accent underline underline-offset-4">
          How to avoid the drop-off charge at every UK airport →
        </Link>
      </p>
    </article>
  );
}
