import type { Metadata } from "next";
import Link from "next/link";
import { loadBaggageDataset } from "@mathfamily/data";
import { itemListLd, JsonLd } from "@mathfamily/geo";
import { FeeGrid } from "@mathfamily/ui";
import { feeRangeLabel } from "@/lib/baggage-content";

export const metadata: Metadata = {
  title: "Airline baggage fees 2026 — cabin & checked bag prices, verified",
  description:
    "Cabin and checked bag fees for 12 UK-popular airlines — Ryanair, easyJet, British Airways and more — verified against official fee pages with official published min–max ranges."
};

export default function BaggageFeesIndexPage() {
  const { records, lastUpdated } = loadBaggageDataset();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  return (
    <article className="space-y-8">
      <JsonLd
        data={itemListLd({
          name: "UK airline baggage fees 2026",
          items: records.map((r) => ({
            name: (() => {
              const cabin = r.fees.find((f) => f.item.toLowerCase().includes("cabin"));
              const checked = r.fees.find(
                (f) => f.item.toLowerCase().includes("checked") || /\b\d{2}kg\b/.test(f.item)
              );
              const cabinLabel = cabin ? feeRangeLabel(cabin) : "—";
              const checkedLabel = checked ? feeRangeLabel(checked) : "—";
              return `${r.airlineName} — ${cabin ? cabin.item : "cabin bag"} ${cabinLabel}${checked && checked !== cabin ? `; ${checked.item} ${checkedLabel}` : ""}`;
            })(),
            url: `${siteUrl}/baggage-fees/${r.airlineSlug}`
          }))
        })}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">Airline baggage fees: 12 carriers compared</h1>
        <p className="text-ink-muted">
          Official published min–max bag charges for 12 UK-popular airlines, verified {lastUpdated}. Click an airline for the full fee breakdown.
        </p>
      </header>

      <FeeGrid
        caption={`Baggage fees for 12 airlines — verified ${lastUpdated}. Ranges reflect official published min–max charges.`}
        columns={["Airline", "Cabin bag", "First checked bag", "Verified"]}
        rows={records.map((r) => {
          const cabin = r.fees.find((f) => f.item.toLowerCase().includes("cabin"));
          const checked = r.fees.find(
            (f) => f.item.toLowerCase().includes("checked") || /\b\d{2}kg\b/.test(f.item)
          );
          return [
            r.airlineName,
            cabin ? feeRangeLabel(cabin) : "—",
            checked && checked !== cabin ? feeRangeLabel(checked) : "—",
            r.verifiedAt
          ];
        })}
      />

      <nav aria-label="Airline baggage fee pages">
        <h2 className="mb-3 text-xl font-semibold text-ink">Airline fee pages</h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {records.map((r) => (
            <li key={r.airlineSlug}>
              <Link
                href={`/baggage-fees/${r.airlineSlug}`}
                className="font-medium text-brand-accent underline underline-offset-4"
              >
                {r.airlineName} baggage fees →
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
