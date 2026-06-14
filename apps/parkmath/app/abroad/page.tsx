import type { Metadata } from "next";
import Link from "next/link";
import { formatPence } from "@mathfamily/engine";
import { breadcrumbLd, itemListLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";
import { abroadModel, abroadAirportSlugs } from "@/lib/abroad-content";

export const metadata: Metadata = {
  title: "Going abroad by car — what the whole trip costs from each UK airport",
  description:
    "The combined cost of driving to a UK airport and going abroad: parking or drop-off, phone roaming and baggage — verified per airport.",
  alternates: { canonical: "/abroad" }
};

export default function AbroadIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const rows = abroadAirportSlugs()
    .map((slug) => abroadModel(slug))
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.airport.name.localeCompare(b.airport.name));

  return (
    <article className="space-y-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Going abroad by car", url: `${siteUrl}/abroad` }
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: "Going abroad by car — UK airports",
          items: rows.map((m) => ({ name: `Going abroad from ${m.airport.name}`, url: `${siteUrl}/abroad/${m.airport.slug}` }))
        })}
      />

      <header className="space-y-3">
        <PageHeading>Going abroad by car — what the whole trip costs</PageHeading>
        <p className="text-ink-muted">
          Pick your airport for the combined cost: parking or drop-off, using your phone abroad, and baggage — every figure verified.
        </p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((m) => (
          <li key={m.airport.slug}>
            <Link
              href={`/abroad/${m.airport.slug}`}
              className="mf-press flex items-center justify-between rounded-card border border-ink/10 bg-card px-4 py-3 hover:border-brand-accent/40"
            >
              <span className="font-medium text-ink">{m.airport.name}</span>
              <span className="text-sm text-ink-muted">
                {m.cheapestParkingPence !== null
                  ? `parking from ${formatPence(m.cheapestParkingPence)}`
                  : m.dropOff.isFree
                    ? "free drop-off"
                    : "see costs"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
