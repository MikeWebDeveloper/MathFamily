import type { Metadata } from "next";
import Link from "next/link";
import { loadAirports, loadDropOffDataset } from "@mathfamily/data";
import { breadcrumbLd, JsonLd } from "@mathfamily/geo";
import { PageHeading } from "@mathfamily/ui";
import { EmbedBuilder, type EmbedAirportOption } from "@/components/embed-builder";

export const metadata: Metadata = {
  title: "Embed the UK airport drop-off charges table — free widget",
  description:
    "Add the live, verified UK airport drop-off charges league table to your own site with one line of copy-paste code. Free iframe + script embed, always up to date, sourced from each airport's official page.",
  alternates: { canonical: "/embed" }
};

export default function EmbedPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const dataset = loadDropOffDataset();
  // Only airports present in the drop-off dataset can be shown (single-fee variant), sorted A–Z.
  const slugsWithData = new Set(dataset.records.map((r) => r.airportSlug));
  const airports: EmbedAirportOption[] = loadAirports()
    .filter((a) => slugsWithData.has(a.slug))
    .map((a) => ({ slug: a.slug, name: a.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <article className="max-w-2xl space-y-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: siteUrl },
          { name: "Drop-off charges", url: `${siteUrl}/drop-off-charges` },
          { name: "Embed the table", url: `${siteUrl}/embed` }
        ])}
      />

      <header className="space-y-3">
        <PageHeading>Embed the drop-off charges table</PageHeading>
        <p className="mf-speakable text-lead text-ink">
          Put the live, always-current UK airport drop-off charges table on your own site — free, with
          one line of code. It updates automatically whenever we re-verify a fee, so it never goes
          stale, and every figure links back to the airport&apos;s official source.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold text-ink">Build your embed</h2>
        <p className="text-sm text-ink-muted">
          Pick the full league table or a single airport&apos;s fee, preview it, then copy the code into
          any page. It works in plain HTML, WordPress (Custom HTML block), Ghost, Squarespace and most
          CMSes.
        </p>
        <EmbedBuilder siteUrl={siteUrl} airports={airports} />
      </section>

      <section className="space-y-2 rounded-lg border border-ink/10 bg-surface-muted px-4 py-3 text-sm text-ink-muted">
        <h2 className="text-base font-semibold text-ink">A few notes</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">It&apos;s free, and it stays current.</strong> The widget reads
            the same verified dataset as the main table — re-checked against each airport&apos;s official
            page — so you never have to update the numbers by hand.
          </li>
          <li>
            <strong className="text-ink">Attribution is built in.</strong> Each embed carries a small
            &ldquo;Source: ParkMath&rdquo; line linking back here. Please keep it — it&apos;s the only
            thing we ask in return.
          </li>
          <li>
            <strong className="text-ink">Prefer the raw data?</strong> Download the{" "}
            <Link href="/data/drop-off-charges.csv" className="font-semibold text-brand-accent hover:underline">
              open CSV
            </Link>{" "}
            or read{" "}
            <Link href="/methodology" className="font-semibold text-brand-accent hover:underline">
              how we verify every price
            </Link>
            .
          </li>
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/drop-off-charges" className="font-semibold text-brand-accent underline underline-offset-4">
          ← Back to the full drop-off charges comparison
        </Link>
      </p>
    </article>
  );
}
